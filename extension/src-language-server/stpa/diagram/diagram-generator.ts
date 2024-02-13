/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { AstNode } from "langium";
import { GeneratorContext, IdCache, LangiumDiagramGenerator } from "langium-sprotty";
import { SLabel, SModelElement, SModelRoot, SNode } from "sprotty-protocol";

import {
    Command,
    Graph,
    Hazard,
    Model,
    Node,
    SystemConstraint,
    Variable,
    VerticalEdge,
    isContext,
    isHazard,
    isSystemConstraint,
    isUCA,
} from "../../generated/ast";
import { getDescription } from "../../utils";
import { StpaServices } from "../stpa-module";
import { collectElementsWithSubComps, leafElement } from "../utils";
import { filterModel } from "./filtering";
import { CSEdge, CSNode, ParentNode, STPAEdge, STPANode, PastaPort } from "./stpa-interfaces";
import {
    CS_EDGE_TYPE,
    CS_INTERMEDIATE_EDGE_TYPE,
    CS_NODE_TYPE,
    DUMMY_NODE_TYPE,
    EdgeType,
    HEADER_LABEL_TYPE,
    INVISIBLE_NODE_TYPE,
    PARENT_TYPE,
    PROCESS_MODEL_NODE_TYPE,
    PortSide,
    STPAAspect,
    STPA_EDGE_TYPE,
    STPA_INTERMEDIATE_EDGE_TYPE,
    STPA_NODE_TYPE,
    PORT_TYPE,
} from "./stpa-model";
import { StpaSynthesisOptions, showLabelsValue } from "./stpa-synthesis-options";
import {
    createUCAContextDescription,
    getAspect,
    getAspectsThatShouldHaveDesriptions,
    getCommonAncestor,
    getTargets,
    setLevelOfCSNodes,
    setLevelsForSTPANodes,
    sortPorts,
} from "./utils";

export class StpaDiagramGenerator extends LangiumDiagramGenerator {
    protected readonly options: StpaSynthesisOptions;

    /** Saves the Ids of the generated SNodes */
    protected idToSNode: Map<string, SNode> = new Map();

    constructor(services: StpaServices) {
        super(services);
        this.options = services.options.SynthesisOptions;
    }

    /**
     * Generates a SGraph for the STPA model contained in {@code args}.
     * @param args GeneratorContext for the STPA model.
     * @returns the root of the generated SGraph.
     */
    protected generateRoot(args: GeneratorContext<Model>): SModelRoot {
        const { document } = args;
        const model: Model = document.parseResult.value;
        // filter model based on the options set by the user
        const filteredModel = filterModel(model, this.options);

        const showLabels = this.options.getShowLabels();
        // aspects that should have a description when showLabel option is set to automatic
        const aspectsToShowDescriptions = getAspectsThatShouldHaveDesriptions(model);

        // determine the children for the STPA graph
        // for each component a node is generated with edges representing the references of the component
        // in order to be able to set the target IDs of the edges, the nodes must be created in the correct order
        let stpaChildren: SModelElement[] = filteredModel.losses?.map(l =>
            this.generateSTPANode(
                l,
                showLabels === showLabelsValue.ALL ||
                    showLabels === showLabelsValue.LOSSES ||
                    (showLabels === showLabelsValue.AUTOMATIC && aspectsToShowDescriptions.includes(STPAAspect.LOSS)),
                args
            )
        );
        // the hierarchy option determines whether subcomponents are contained in ther parent or not
        if (!this.options.getHierarchy()) {
            // subcomponents have edges to the parent
            const hazards = collectElementsWithSubComps(filteredModel.hazards);
            const sysCons = collectElementsWithSubComps(filteredModel.systemLevelConstraints);
            stpaChildren = stpaChildren?.concat([
                ...hazards
                    .map(sh =>
                        this.generateAspectWithEdges(
                            sh,
                            showLabels === showLabelsValue.ALL ||
                                showLabels === showLabelsValue.HAZARDS ||
                                (showLabels === showLabelsValue.AUTOMATIC &&
                                    aspectsToShowDescriptions.includes(STPAAspect.HAZARD)),
                            args
                        )
                    )
                    .flat(1),
                ...sysCons
                    .map(ssc =>
                        this.generateAspectWithEdges(
                            ssc,
                            showLabels === showLabelsValue.ALL ||
                                showLabels === showLabelsValue.SYSTEM_CONSTRAINTS ||
                                (showLabels === showLabelsValue.AUTOMATIC &&
                                    aspectsToShowDescriptions.includes(STPAAspect.SYSTEMCONSTRAINT)),
                            args
                        )
                    )
                    .flat(1),
            ]);
        } else {
            // subcomponents are contained in the parent
            stpaChildren = stpaChildren?.concat([
                ...filteredModel.hazards
                    ?.map(h =>
                        this.generateAspectWithEdges(
                            h,
                            showLabels === showLabelsValue.ALL ||
                                showLabels === showLabelsValue.HAZARDS ||
                                (showLabels === showLabelsValue.AUTOMATIC &&
                                    aspectsToShowDescriptions.includes(STPAAspect.HAZARD)),
                            args
                        )
                    )
                    .flat(1),
                ...filteredModel.systemLevelConstraints
                    ?.map(sc =>
                        this.generateAspectWithEdges(
                            sc,
                            showLabels === showLabelsValue.ALL ||
                                showLabels === showLabelsValue.SYSTEM_CONSTRAINTS ||
                                (showLabels === showLabelsValue.AUTOMATIC &&
                                    aspectsToShowDescriptions.includes(STPAAspect.SYSTEMCONSTRAINT)),
                            args
                        )
                    )
                    .flat(1),
                ...filteredModel.systemLevelConstraints
                    ?.map(sc => sc.subComponents?.map(ssc => this.generateEdgesForSTPANode(ssc, args)))
                    .flat(2),
            ]);
        }
        stpaChildren = stpaChildren?.concat([
            ...filteredModel.responsibilities
                ?.map(r =>
                    r.responsiblitiesForOneSystem.map(resp =>
                        this.generateAspectWithEdges(
                            resp,
                            showLabels === showLabelsValue.ALL ||
                                showLabels === showLabelsValue.RESPONSIBILITIES ||
                                (showLabels === showLabelsValue.AUTOMATIC &&
                                    aspectsToShowDescriptions.includes(STPAAspect.RESPONSIBILITY)),
                            args
                        )
                    )
                )
                .flat(2),
            ...filteredModel.allUCAs
                ?.map(sysUCA =>
                    sysUCA.providingUcas
                        .concat(sysUCA.notProvidingUcas, sysUCA.wrongTimingUcas, sysUCA.continousUcas)
                        .map(uca =>
                            this.generateAspectWithEdges(
                                uca,
                                showLabels === showLabelsValue.ALL ||
                                    showLabels === showLabelsValue.UCAS ||
                                    (showLabels === showLabelsValue.AUTOMATIC &&
                                        aspectsToShowDescriptions.includes(STPAAspect.UCA)),
                                args
                            )
                        )
                )
                .flat(2),
            ...filteredModel.rules
                ?.map(rule =>
                    rule.contexts.map(context =>
                        this.generateAspectWithEdges(
                            context,
                            showLabels === showLabelsValue.ALL ||
                                showLabels === showLabelsValue.UCAS ||
                                (showLabels === showLabelsValue.AUTOMATIC &&
                                    aspectsToShowDescriptions.includes(STPAAspect.UCA)),
                            args
                        )
                    )
                )
                .flat(2),
            ...filteredModel.controllerConstraints
                ?.map(c =>
                    this.generateAspectWithEdges(
                        c,
                        showLabels === showLabelsValue.ALL ||
                            showLabels === showLabelsValue.CONTROLLER_CONSTRAINTS ||
                            (showLabels === showLabelsValue.AUTOMATIC &&
                                aspectsToShowDescriptions.includes(STPAAspect.CONTROLLERCONSTRAINT)),
                        args
                    )
                )
                .flat(1),
            ...filteredModel.scenarios
                ?.map(s =>
                    this.generateAspectWithEdges(
                        s,
                        showLabels === showLabelsValue.ALL ||
                            showLabels === showLabelsValue.SCENARIOS ||
                            (showLabels === showLabelsValue.AUTOMATIC &&
                                aspectsToShowDescriptions.includes(STPAAspect.SCENARIO)),
                        args
                    )
                )
                .flat(1),
            ...filteredModel.safetyCons
                ?.map(sr =>
                    this.generateAspectWithEdges(
                        sr,
                        showLabels === showLabelsValue.ALL ||
                            showLabels === showLabelsValue.SAFETY_CONSTRAINTS ||
                            (showLabels === showLabelsValue.AUTOMATIC &&
                                aspectsToShowDescriptions.includes(STPAAspect.SAFETYREQUIREMENT)),
                        args
                    )
                )
                .flat(1),
        ]);

        // filtering the nodes of the STPA graph
        const stpaNodes: STPANode[] = [];
        for (const node of stpaChildren ?? []) {
            if (node.type === STPA_NODE_TYPE) {
                stpaNodes.push(node as STPANode);
            }
        }
        // each node should be placed in a specific layer based on the aspect. therefore positions must be set
        setLevelsForSTPANodes(stpaNodes, this.options.getGroupingUCAs());

        const rootChildren: SModelElement[] = [];
        if (filteredModel.controlStructure) {
            setLevelOfCSNodes(filteredModel.controlStructure?.nodes);
            // determine the nodes of the control structure graph
            const csNodes = filteredModel.controlStructure?.nodes.map(n => this.createControlStructureNode(n, args));
            // children (nodes and edges) of the control structure
            const CSChildren = [
                ...csNodes,
                ...this.generateVerticalCSEdges(filteredModel.controlStructure.nodes, args),
                //...this.generateHorizontalCSEdges(filteredModel.controlStructure.edges, args)
            ];
            sortPorts(CSChildren.filter(node => node.type.startsWith("node")) as CSNode[]);
            // add control structure to roots children
            rootChildren.push({
                type: PARENT_TYPE,
                id: "controlStructure",
                children: CSChildren,
                modelOrder: this.options.getModelOrder(),
            } as ParentNode);
        }
        // add relationship graph to roots children
        rootChildren.push({
            type: PARENT_TYPE,
            id: "relationships",
            children: stpaChildren,
            modelOrder: this.options.getModelOrder(),
        } as ParentNode);
        // return root
        return {
            type: "graph",
            id: "root",
            children: rootChildren,
        };
    }

    /**
     * Generates a single control structure node for the given {@code node},
     * @param node The system component a CSNode should be created for.
     * @param param1 GeneratorContext of the STPA model.
     * @returns A CSNode representing {@code node}.
     */
    protected createControlStructureNode(node: Node, args: GeneratorContext<Model>): CSNode {
        const idCache = args.idCache;
        const label = node.label ? node.label : node.name;
        const nodeId = idCache.uniqueId(node.name, node);
        const children: SModelElement[] = this.createLabel([label], nodeId, idCache);
        if (this.options.getShowProcessModels()) {
            children.push(this.createProcessModelNodes(node.variables, idCache));
        }
        // add children of the control structure node
        if (node.children?.length !== 0) {
            const invisibleNode = {
                type: INVISIBLE_NODE_TYPE,
                id: idCache.uniqueId(node.name + "_invisible"),
                children: [] as SModelElement[],
                layout: "stack",
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddingLeft: 10.0,
                    paddingRight: 10.0,
                },
            };
            node.children?.forEach(child => {
                invisibleNode.children?.push(this.createControlStructureNode(child, args));
            });
            children.push(invisibleNode);
        }
        const csNode = {
            type: CS_NODE_TYPE,
            id: nodeId,
            level: node.level,
            children: children,
            layout: "stack",
            layoutOptions: {
                paddingTop: 10.0,
                paddingBottom: 10.0,
                paddingLeft: 10.0,
                paddingRight: 10.0,
            },
        };
        this.idToSNode.set(nodeId, csNode);
        return csNode;
    }

    protected createProcessModelNodes(variables: Variable[], idCache: IdCache<AstNode>): SModelElement {
        const csChildren: SModelElement[] = [];
        for (const variable of variables) {
            const label = variable.name;
            const nodeId = idCache.uniqueId(variable.name, variable);
            const values = variable.values?.map(value => value.name);
            const children = [
                ...this.createLabel([label], nodeId, idCache, HEADER_LABEL_TYPE),
                ...this.createLabel(values, nodeId, idCache),
            ];
            const csNode = {
                type: CS_NODE_TYPE,
                id: nodeId,
                children: children,
                layout: "stack",
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddingLeft: 10.0,
                    paddingRight: 10.0,
                },
            } as CSNode;
            csChildren.push(csNode);
        }
        const invisibleNode = {
            type: PROCESS_MODEL_NODE_TYPE,
            id: idCache.uniqueId("invisible"),
            children: csChildren,
            layout: "stack",
            layoutOptions: {
                paddingTop: 10.0,
                paddingBottom: 10.0,
                paddingLeft: 10.0,
                paddingRight: 10.0,
            },
        };
        return invisibleNode;
    }

    /**
     * Creates the edges for the control structure.
     * @param nodes The nodes of the control structure.
     * @param args GeneratorContext of the STPA model
     * @returns A list of edges for the control structure.
     */
    protected generateVerticalCSEdges(nodes: Node[], args: GeneratorContext<Model>): (CSNode | CSEdge)[] {
        const edges: (CSNode | CSEdge)[] = [];
        // for every control action and feedback of every a node, a edge should be created
        for (const node of nodes) {
            // create edges representing the control actions
            edges.push(...this.translateCommandsToEdges(node.actions, EdgeType.CONTROL_ACTION, args));
            // create edges representing feedback
            edges.push(...this.translateCommandsToEdges(node.feedbacks, EdgeType.FEEDBACK, args));
            // create edges representing the other inputs
            edges.push(...this.translateIOToEdgeAndNode(node.inputs, node, EdgeType.INPUT, args));
            // create edges representing the other outputs
            edges.push(...this.translateIOToEdgeAndNode(node.outputs, node, EdgeType.OUTPUT, args));
            // create edges for children and add the ones that must be added at the top level
            edges.push(...this.generateVerticalCSEdges(node.children, args));
        }
        return edges;
    }

    /**
     * Translates the commands (control action or feedback) of a node to edges.
     * @param commands The control actions or feedback of a node.
     * @param edgeType The type of the edge (control action or feedback).
     * @param args GeneratorContext of the STPA model.
     * @returns A list of edges representing the commands.
     */
    protected translateCommandsToEdges(
        commands: VerticalEdge[],
        edgeType: EdgeType,
        args: GeneratorContext<Model>
    ): CSEdge[] {
        const idCache = args.idCache;
        const edges: CSEdge[] = [];
        for (const edge of commands) {
            const source = edge.$container;
            const target = edge.target.ref;
            const edgeId = idCache.uniqueId(
                `${idCache.getId(source)}_${edge.comms[0].name}_${idCache.getId(target)}`,
                edge
            );

            if (target) {
                // multiple commands to same target is represented by one edge
                const label: string[] = [];
                for (let i = 0; i < edge.comms.length; i++) {
                    const com = edge.comms[i];
                    label.push(com.label);
                }
                // edges can be hierachy crossing so we must determine the common ancestor
                const commonAncestor = getCommonAncestor(source, target);
                // create the intermediate ports and edges for the control action
                const ports = this.generateIntermediateCSEdges(source, target, edgeId, edgeType, args, commonAncestor);
                // add edge between the two ports in the common ancestor
                const csEdge = this.createControlStructureEdge(
                    idCache.uniqueId(edgeId),
                    ports.sourcePort,
                    ports.targetPort,
                    label,
                    edgeType,
                    target.$container === commonAncestor ? CS_EDGE_TYPE : CS_INTERMEDIATE_EDGE_TYPE,
                    args
                );
                if (commonAncestor?.$type === "Graph") {
                    edges.push(csEdge);
                } else if (commonAncestor) {
                    const snodeAncestor = this.idToSNode.get(idCache.getId(commonAncestor)!);
                    snodeAncestor?.children?.find(node => node.type === INVISIBLE_NODE_TYPE)?.children?.push(csEdge);
                }
            }
        }
        return edges;
    }

    /**
     * Create the source and target port for the edge with the given {@code edgeId}.
     * @param sourceId The id of the source node.
     * @param sourceSide The side of the source node the edge should be connected to.
     * @param targetId The id of the target node.
     * @param targetSide The side of the target node the edge should be connected to.
     * @param edgeId The id of the edge.
     * @param idCache The id cache of the STPA model.
     * @returns the ids of the source and target port the edge should be connected to.
     */
    protected createPortsForEdge(
        sourceId: string,
        sourceSide: PortSide,
        targetId: string,
        targetSide: PortSide,
        edgeId: string,
        idCache: IdCache<AstNode>
    ): { sourcePortId: string; targetPortId: string } {
        // add ports for source and target
        const sourceNode = this.idToSNode.get(sourceId);
        const sourcePortId = idCache.uniqueId(edgeId + "_newTransition");
        sourceNode?.children?.push(this.createPort(sourcePortId, sourceSide));

        const targetNode = this.idToSNode.get(targetId!);
        const targetPortId = idCache.uniqueId(edgeId + "_newTransition");
        targetNode?.children?.push(this.createPort(targetPortId, targetSide));

        return { sourcePortId, targetPortId };
    }

    /**
     * Translates the inputs or outputs of a node to edges.
     * @param io The inputs or outputs of a node.
     * @param node The node of the inputs or outputs.
     * @param edgetype The type of the edge (input or output).
     * @param args GeneratorContext of the STPA model.
     * @returns a list of edges representing the inputs or outputs.
     */
    protected translateIOToEdgeAndNode(
        io: Command[],
        node: Node,
        edgetype: EdgeType,
        args: GeneratorContext<Model>
    ): (CSNode | CSEdge)[] {
        if (io.length !== 0) {
            const idCache = args.idCache;
            const nodeId = idCache.getId(node);

            // create the label of the edge
            const label: string[] = [];
            for (let i = 0; i < io.length; i++) {
                const command = io[i];
                label.push(command.label);
            }

            let graphComponents: (CSNode | CSEdge)[] = [];
            switch (edgetype) {
                case EdgeType.INPUT:
                    // create dummy node for the input
                    const inputDummyNode = this.createDummyNode(
                        "input" + node.name,
                        node.level ? node.level - 1 : undefined,
                        idCache
                    );
                    // create edge for the input
                    const inputEdge = this.createControlStructureEdge(
                        idCache.uniqueId(`${inputDummyNode.id}_input_${nodeId}`),
                        inputDummyNode.id ? inputDummyNode.id : "",
                        nodeId ? nodeId : "",
                        label,
                        edgetype,
                        CS_EDGE_TYPE,
                        args
                    );
                    graphComponents = [inputEdge, inputDummyNode];
                    break;
                case EdgeType.OUTPUT:
                    // create dummy node for the output
                    const outputDummyNode = this.createDummyNode(
                        "output" + node.name,
                        node.level ? node.level + 1 : undefined,
                        idCache
                    );
                    // create edge for the output
                    const outputEdge = this.createControlStructureEdge(
                        idCache.uniqueId(`${nodeId}_output_${outputDummyNode.id}`),
                        nodeId ? nodeId : "",
                        outputDummyNode.id ? outputDummyNode.id : "",
                        label,
                        edgetype,
                        CS_EDGE_TYPE,
                        args
                    );
                    graphComponents = [outputEdge, outputDummyNode];
                    break;
                default:
                    console.error("EdgeType is not INPUT or OUTPUT");
                    break;
            }
            return graphComponents;
        }
        return [];
    }

    // for this in-layer edges are needed, which are not supported by ELK at the moment
    /*     protected generateHorizontalCSEdges(edges: Edge[], args: GeneratorContext<Model>): SEdge[]{
            const idCache = args.idCache
            let genEdges: SEdge[] = []
            for (const edge of edges) {
                const sourceId = idCache.getId(edge.source.ref)
                const targetId = idCache.getId(edge.target.ref)
                const edgeId = idCache.uniqueId(`${sourceId}:${edge.name}:${targetId}`, edge)
                const e = this.generateSEdge(edgeId, sourceId ? sourceId : '', targetId ? targetId : '', 
                                edge.label? edge.label:edge.name, args)
                genEdges.push(e)
            }
            return genEdges
        } */

    /**
     * Generates a node and the edges for the given {@code node}.
     * @param node STPA component for which a node and edges should be generated.
     * @param args GeneratorContext of the STPA model.
     * @returns A node representing {@code node} and edges representing the references {@code node} contains.
     */
    protected generateAspectWithEdges(
        node: leafElement,
        showDescription: boolean,
        args: GeneratorContext<Model>
    ): SModelElement[] {
        // node must be created first in order to access the id when creating the edges
        const stpaNode = this.generateSTPANode(node, showDescription, args);
        // uca nodes need to save their control action in order to be able to group them by the actions
        if ((isUCA(node) || isContext(node)) && node.$container.system.ref) {
            stpaNode.controlAction = node.$container.system.ref.name + "." + node.$container.action.ref?.name;
        }
        const elements: SModelElement[] = this.generateEdgesForSTPANode(node, args);
        elements.push(stpaNode);
        return elements;
    }

    /**
     * Generates a single STPANode for the given {@code node}.
     * @param node The STPA component the node should be created for.
     * @param args GeneratorContext of the STPA model.
     * @returns A STPANode representing {@code node}.
     */
    protected generateSTPANode(node: leafElement, showDescription: boolean, args: GeneratorContext<Model>): STPANode {
        const idCache = args.idCache;
        const nodeId = idCache.uniqueId(node.name, node);
        // determines the hierarchy level for subcomponents. For other components the value is 0.
        let lvl = 0;
        let container = node.$container;
        while (isHazard(container) || isSystemConstraint(container)) {
            lvl++;
            container = container.$container;
        }

        let children: SModelElement[] = this.generateDescriptionLabels(
            showDescription,
            nodeId,
            node.name,
            args.idCache,
            isContext(node) ? createUCAContextDescription(node) : node.description
        );
        // if the hierarchy option is true, the subcomponents are added as children to the parent
        if (this.options.getHierarchy() && isHazard(node) && node.subComponents.length !== 0) {
            // adds subhazards
            children = children.concat(
                node.subComponents?.map((sc: Hazard) => this.generateSTPANode(sc, showDescription, args))
            );
        }
        if (this.options.getHierarchy() && isSystemConstraint(node) && node.subComponents.length !== 0) {
            // adds subconstraints
            children = children.concat(
                node.subComponents?.map((sc: SystemConstraint) => this.generateSTPANode(sc, showDescription, args))
            );
        }

        if (isContext(node)) {
            // context UCAs have no description
            const result = this.createSTPANode(node, nodeId, lvl, "", children);
            this.idToSNode.set(nodeId, result);
            return result;
        } else {
            const result = this.createSTPANode(node, nodeId, lvl, node.description, children);
            this.idToSNode.set(nodeId, result);
            return result;
        }
    }

    /**
     * Generates the edges for {@code node}.
     * @param node STPA component for which the edges should be created.
     * @param args GeneratorContext of the STPA model.
     * @returns Edges representing the references {@code node} contains.
     */
    protected generateEdgesForSTPANode(node: AstNode, args: GeneratorContext<Model>): SModelElement[] {
        const elements: SModelElement[] = [];
        // for every reference an edge is created
        // if hierarchy option is false, edges from subcomponents to parents are created too
        const targets = getTargets(node, this.options.getHierarchy());
        for (const target of targets) {
            const edge = this.generateSTPAEdge(node, target, "", args);
            if (edge) {
                elements.push(edge);
            }
        }
        return elements;
    }

    /**
     * Generates a single STPAEdge based on the given arguments.
     * @param source The source of the edge.
     * @param target The target of the edge.
     * @param label The label of the edge.
     * @param param4 GeneratorContext of the STPA model.
     * @returns An STPAEdge.
     */
    protected generateSTPAEdge(
        source: AstNode,
        target: AstNode,
        label: string,
        { idCache }: GeneratorContext<Model>
    ): STPAEdge | undefined {
        // get the IDs
        const targetId = idCache.getId(target);
        const sourceId = idCache.getId(source);
        const edgeId = idCache.uniqueId(`${sourceId}_${targetId}`, undefined);

        if (sourceId && targetId) {
            // create the label of the edge
            let children: SModelElement[] = [];
            if (label !== "") {
                children = this.createLabel([label], edgeId, idCache);
            }

            if ((isHazard(target) || isSystemConstraint(target)) && target.$container?.$type !== "Model") {
                // if the target is a subcomponent we need to add several ports and edges through the hierarchical structure
                return this.generateIntermediateIncomingSTPAEdges(target, source, sourceId, edgeId, children, idCache);
            } else {
                // otherwise it is sufficient to add ports for source and target
                const portIds = this.createPortsForEdge(
                    sourceId,
                    PortSide.NORTH,
                    targetId,
                    PortSide.SOUTH,
                    edgeId,
                    idCache
                );

                // add edge between the two ports
                return this.createSTPAEdge(
                    edgeId,
                    portIds.sourcePortId,
                    portIds.targetPortId,
                    children,
                    STPA_EDGE_TYPE,
                    getAspect(source)
                );
            }
        }
    }

    /**
     * Generates incoming edges between the {@code source}, the top parent(s), and the {@code target}.
     * @param target The target of the edge.
     * @param source The source of the edge.
     * @param sourceId The ID of the source of the edge.
     * @param edgeId The ID of the original edge.
     * @param children The children of the original edge.
     * @param idCache The ID cache of the STPA model.
     * @returns an STPAEdge to connect the {@code source} (or its top parent) with the top parent of the {@code target}.
     */
    protected generateIntermediateIncomingSTPAEdges(
        target: AstNode,
        source: AstNode,
        sourceId: string,
        edgeId: string,
        children: SModelElement[],
        idCache: IdCache<AstNode>
    ): STPAEdge {
        // add ports to the target and its (grand)parents
        const targetPortIds = this.generatePortsForHierarchy(target, edgeId, PortSide.SOUTH, idCache);

        // add edges between the ports
        let current: AstNode | undefined = target;
        for (let i = 0; current && current?.$type !== "Model"; i++) {
            const currentNode = this.idToSNode.get(idCache.getId(current.$container)!);
            const edgeType = i === 0 ? STPA_EDGE_TYPE : STPA_INTERMEDIATE_EDGE_TYPE;
            currentNode?.children?.push(
                this.createSTPAEdge(
                    idCache.uniqueId(edgeId),
                    targetPortIds[i + 1],
                    targetPortIds[i],
                    children,
                    edgeType,
                    getAspect(source)
                )
            );
            current = current?.$container;
        }

        if (isSystemConstraint(source) && source.$container?.$type !== "Model") {
            // if the source is a sub-sytemconstraint we also need intermediate edges to the top system constraint
            return this.generateIntermediateOutgoingSTPAEdges(
                source,
                edgeId,
                children,
                targetPortIds[targetPortIds.length - 1],
                idCache
            );
        } else {
            // add port for source node
            const sourceNode = this.idToSNode.get(sourceId);
            const sourcePortId = idCache.uniqueId(edgeId + "_newTransition");
            sourceNode?.children?.push(this.createPort(sourcePortId, PortSide.NORTH));

            // add edge from source to top parent of the target
            return this.createSTPAEdge(
                edgeId,
                sourcePortId,
                targetPortIds[targetPortIds.length - 1],
                children,
                STPA_INTERMEDIATE_EDGE_TYPE,
                getAspect(source)
            );
        }
    }

    /**
     * Generates outgoing edges between the {@code source}, its top parent(s), and {@code targetPortId}.
     * @param source The source of the original edge.
     * @param edgeId The ID of the original edge.
     * @param children The children of the original edge.
     * @param targetPortId The ID of the target port.
     * @param idCache The ID cache of the STPA model.
     * @returns the STPAEdge to connect the top parent of the {@code source} with the {@code targetPortId}.
     */
    protected generateIntermediateOutgoingSTPAEdges(
        source: AstNode,
        edgeId: string,
        children: SModelElement[],
        targetPortId: string,
        idCache: IdCache<AstNode>
    ): STPAEdge {
        // add ports to the source and its (grand)parents
        const sourceIds = this.generatePortsForHierarchy(source, edgeId, PortSide.NORTH, idCache);

        // add edges between the ports
        let current: AstNode | undefined = source;
        for (let i = 0; current && current?.$type !== "Model"; i++) {
            const currentNode = this.idToSNode.get(idCache.getId(current.$container)!);
            currentNode?.children?.push(
                this.createSTPAEdge(
                    idCache.uniqueId(edgeId),
                    sourceIds[i],
                    sourceIds[i + 1],
                    children,
                    STPA_INTERMEDIATE_EDGE_TYPE,
                    getAspect(source)
                )
            );
            current = current?.$container;
        }

        return this.createSTPAEdge(
            edgeId,
            sourceIds[sourceIds.length - 1],
            targetPortId,
            children,
            STPA_INTERMEDIATE_EDGE_TYPE,
            getAspect(source)
        );
    }

    /**
     * Generates ports for the {@code current} and its (grand)parents.
     * @param current The current node.
     * @param edgeId The ID of the original edge for which the ports are created.
     * @param side The side of the ports.
     * @param idCache The ID cache of the STPA model.
     * @returns the IDs of the created ports.
     */
    protected generatePortsForHierarchy(
        current: AstNode | undefined,
        edgeId: string,
        side: PortSide,
        idCache: IdCache<AstNode>
    ): string[] {
        const ids: string[] = [];
        while (current && current?.$type !== "Model") {
            const currentId = idCache.getId(current);
            const currentNode = this.idToSNode.get(currentId!);
            const portId = idCache.uniqueId(edgeId + "_newTransition");
            currentNode?.children?.push(this.createPort(portId, side));
            ids.push(portId);
            current = current?.$container;
        }
        return ids;
    }

    protected generateIntermediateCSEdges(
        source: Node | undefined,
        target: Node | undefined,
        edgeId: string,
        edgeType: EdgeType,
        args: GeneratorContext<Model>,
        ancestor?: Node | Graph
    ): { sourcePort: string; targetPort: string } {
        const assocEdge = { node1: source?.name ?? "", node2: target?.name ?? "" };
        const sources = this.generatePortsForCSHierarchy(
            source,
            assocEdge,
            edgeId,
            edgeType === EdgeType.CONTROL_ACTION ? PortSide.SOUTH : PortSide.NORTH,
            args.idCache,
            ancestor
        );
        const targets = this.generatePortsForCSHierarchy(
            target,
            assocEdge,
            edgeId,
            edgeType === EdgeType.CONTROL_ACTION ? PortSide.NORTH : PortSide.SOUTH,
            args.idCache,
            ancestor
        );
        for (let i = 0; i < sources.nodes.length - 1; i++) {
            const sEdgeType = CS_INTERMEDIATE_EDGE_TYPE;
            sources.nodes[i + 1]?.children?.push(
                this.createControlStructureEdge(
                    args.idCache.uniqueId(edgeId),
                    sources.portIds[i],
                    sources.portIds[i + 1],
                    [],
                    edgeType,
                    sEdgeType,
                    args,
                    false
                )
            );
        }
        for (let i = 0; i < targets.nodes.length - 1; i++) {
            const sEdgeType = i == 0 ? CS_EDGE_TYPE : CS_INTERMEDIATE_EDGE_TYPE;
            targets.nodes[i + 1]?.children?.push(
                this.createControlStructureEdge(
                    args.idCache.uniqueId(edgeId),
                    targets.portIds[i + 1],
                    targets.portIds[i],
                    [],
                    edgeType,
                    sEdgeType,
                    args,
                    false
                )
            );
        }
        return {
            sourcePort: sources.portIds[sources.portIds.length - 1],
            targetPort: targets.portIds[targets.portIds.length - 1],
        };
    }

    // adds ports for current node and its (grand)parents up to the ancestor. The ancestor get no port.
    protected generatePortsForCSHierarchy(
        current: AstNode | undefined,
        assocEdge: { node1: string; node2: string },
        edgeId: string,
        side: PortSide,
        idCache: IdCache<AstNode>,
        ancestor?: Node | Graph
    ): { portIds: string[]; nodes: SNode[] } {
        const ids: string[] = [];
        const nodes: SNode[] = [];
        while (current && (!ancestor || current !== ancestor)) {
            const currentId = idCache.getId(current);
            if (currentId) {
                const currentNode = this.idToSNode.get(currentId);
                if (currentNode) {
                    const invisibleChild = currentNode?.children?.find(child => child.type === INVISIBLE_NODE_TYPE);
                    if (invisibleChild && ids.length !== 0) {
                        // add port for the invisible node first
                        const invisiblePortId = idCache.uniqueId(edgeId + "_newTransition");
                        invisibleChild.children?.push(this.createPort(invisiblePortId, side, assocEdge));
                        ids.push(invisiblePortId);
                        nodes.push(invisibleChild);
                    }
                    const nodePortId = idCache.uniqueId(edgeId + "_newTransition");
                    currentNode?.children?.push(this.createPort(nodePortId, side, assocEdge));
                    ids.push(nodePortId);
                    nodes.push(currentNode);
                    current = current?.$container;
                }
            }
        }
        return { portIds: ids, nodes: nodes };
    }

    /**
     * Creates an STPANode.
     * @param node The AstNode for which the STPANode should be created.
     * @param nodeId The ID of the STPANode.
     * @param lvl The hierarchy level of the STPANode.
     * @param children The children of the STPANode.
     * @returns an STPANode.
     */
    protected createSTPANode(
        node: AstNode,
        nodeId: string,
        lvl: number,
        description: string,
        children: SModelElement[]
    ): STPANode {
        return {
            type: STPA_NODE_TYPE,
            id: nodeId,
            aspect: getAspect(node),
            description: description,
            hierarchyLvl: lvl,
            children: children,
            layout: "stack",
            layoutOptions: {
                paddingTop: 10.0,
                paddingBottom: 10.0,
                paddingLeft: 10.0,
                paddingRight: 10.0,
            },
            modelOrder: this.options.getModelOrder(),
        };
    }

    /**
     * Creates an STPAPort.
     * @param id The ID of the port.
     * @param side The side of the port.
     * @returns an STPAPort.
     */
    protected createPort(id: string, side: PortSide, assocEdge?: { node1: string; node2: string }): PastaPort {
        return {
            type: PORT_TYPE,
            id: id,
            side: side,
            assocEdge: assocEdge,
        };
    }

    /**
     * Creates an STPAEdge.
     * @param id The ID of the edge.
     * @param sourceId The ID of the source of the edge.
     * @param targetId The ID of the target of the edge.
     * @param children The children of the edge.
     * @param type The type of the edge.
     * @param aspect The aspect of the edge.
     * @returns an STPAEdge.
     */
    protected createSTPAEdge(
        id: string,
        sourceId: string,
        targetId: string,
        children: SModelElement[],
        type: string,
        aspect: STPAAspect
    ): STPAEdge {
        return {
            type: type,
            id: id,
            sourceId: sourceId,
            targetId: targetId,
            children: children,
            aspect: aspect,
        };
    }

    /**
     * Creates a control structure edge based on the given arguments.
     * @param edgeId The ID of the edge that should be created.
     * @param sourceId The ID of the source of the edge.
     * @param targetId The ID of the target of the edge.
     * @param label The labels of the edge.
     * @param edgeType The type of the edge (control action or feedback edge).
     * @param param5 GeneratorContext of the STPA model.
     * @returns A control structure edge.
     */
    protected createControlStructureEdge(
        edgeId: string,
        sourceId: string,
        targetId: string,
        label: string[],
        edgeType: EdgeType,
        sedgeType: string,
        args: GeneratorContext<Model>,
        dummyLabel: boolean = true
    ): CSEdge {
        return {
            type: sedgeType,
            id: edgeId,
            sourceId: sourceId!,
            targetId: targetId!,
            edgeType: edgeType,
            children: this.createLabel(label, edgeId, args.idCache, undefined, dummyLabel),
        };
    }

    /**
     * Generates SLabel elements for the given {@code label}.
     * @param label Labels to translate to SLabel elements.
     * @param id The ID of the element for which the label should be generated.
     * @returns SLabel elements representing {@code label}.
     */
    protected createLabel(
        label: string[],
        id: string,
        idCache: IdCache<AstNode>,
        type: string = "label:xref",
        dummyLabel: boolean = true
    ): SLabel[] {
        const children: SLabel[] = [];
        if (label.find(l => l !== "")) {
            label.forEach(l => {
                children.push({
                    type: type,
                    id: idCache.uniqueId(id + "_label"),
                    text: l,
                } as SLabel);
            });
        } else if (dummyLabel) {
            // needed for correct layout
            children.push({
                type: type,
                id: idCache.uniqueId(id + "_label"),
                text: " ",
            } as SLabel);
        }
        return children;
    }

    /**
     * Creates a dummy node.
     * @param idCache The ID cache of the STPA model.
     * @param level The level of the dummy node.
     * @returns a dummy node.
     */
    protected createDummyNode(name: string, level: number | undefined, idCache: IdCache<AstNode>): CSNode {
        const dummyNode: CSNode = {
            type: DUMMY_NODE_TYPE,
            id: idCache.uniqueId("dummy" + name),
            layout: "stack",
            layoutOptions: {
                paddingTop: 10.0,
                paddingBottom: 10.0,
                paddngLeft: 10.0,
                paddingRight: 10.0,
            },
        };
        if (level) {
            dummyNode.level = level;
        }
        return dummyNode;
    }

    /**
     * Generates the labels for the given node based on {@code showDescription} and the label synthesis options.
     * @param showDescription Determines whether the description should be shown.
     * @param nodeId The ID of the node for which the labels should be generated.
     * @param nodeName The name of the node for which the labels should be generated.
     * @param idCache The ID cache of the STPA model.
     * @param nodeDescription The description of the node for which the labels should be generated.
     * @returns the labels for the given node.
     */
    protected generateDescriptionLabels(
        showDescription: boolean,
        nodeId: string,
        nodeName: string,
        idCache: IdCache<AstNode>,
        nodeDescription?: string
    ): SModelElement[] {
        let children: SModelElement[] = [];
        if (nodeDescription && showDescription) {
            children = getDescription(
                nodeDescription ?? "",
                this.options.getLabelManagement(),
                this.options.getLabelShorteningWidth(),
                nodeId,
                idCache
            );
        }

        // show the name in the top line
        children.push(<SLabel>{
            type: "label",
            id: idCache.uniqueId(nodeId + "_label"),
            text: nodeName,
        });
        return children;
    }
}
