/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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

import { AstNode } from 'langium';
import { GeneratorContext, IdCache, LangiumDiagramGenerator } from 'langium-sprotty';
import { SModelRoot, SLabel, SModelElement, SPort, SNode } from 'sprotty-protocol';
import {
    Command,
    isContConstraint, isContext, isHazard, isLoss, isLossScenario, isResponsibility, isSafetyConstraint,
    isSystemConstraint, isUCA, Model, Node, VE
} from '../generated/ast';
import { CSEdge, CSNode, STPANode, STPAEdge, STPAPort } from './stpa-interfaces';
import { PARENT_TYPE, CS_EDGE_TYPE, CS_NODE_TYPE, STPA_NODE_TYPE, STPA_EDGE_TYPE, EdgeType, DUMMY_NODE_TYPE, PortSide, STPA_PORT_TYPE, STPA_INTERMEDIATE_EDGE_TYPE } from './stpa-model';
import { StpaServices } from './stpa-module';
import { collectElementsWithSubComps, getAspect, getTargets, setLevelsForSTPANodes } from './utils';
import { StpaSynthesisOptions } from './synthesis-options';
import { filterModel } from './filtering';

export class StpaDiagramGenerator extends LangiumDiagramGenerator {

    protected readonly options: StpaSynthesisOptions;

    protected idToSNode: Map<string, SNode> = new Map();

    constructor(services: StpaServices) {
        super(services);
        this.options = services.options.StpaSynthesisOptions;
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

        // determine the children for the STPA graph
        // for each component a node is generated with edges representing the references of the component
        // in order to be able to set the target IDs of the edges, the nodes must be created in the correct order
        let stpaChildren: SModelElement[] = filteredModel.losses?.map(l => this.generateSTPANode(l, args));
        // the hierarchy option determines whether subcomponents are contained in ther parent or not
        if (!this.options.getHierarchy()) {
            // subcomponents have edges to the parent
            const hazards = collectElementsWithSubComps(filteredModel.hazards);
            const sysCons = collectElementsWithSubComps(filteredModel.systemLevelConstraints);
            stpaChildren = stpaChildren.concat([
                ...hazards.map(sh => this.generateAspectWithEdges(sh, args)).flat(1),
                ...sysCons.map(ssc => this.generateAspectWithEdges(ssc, args)).flat(1)
            ]);
        } else {
            // subcomponents are contained in the parent
            stpaChildren = stpaChildren.concat([
                ...filteredModel.hazards?.map(h => this.generateAspectWithEdges(h, args)).flat(1),
                ...filteredModel.systemLevelConstraints?.map(sc => this.generateAspectWithEdges(sc, args)).flat(1),
                ...filteredModel.systemLevelConstraints?.map(sc => sc.subComps?.map(ssc => this.generateEdgesForSTPANode(ssc, args))).flat(2)
            ]);
        }
        stpaChildren = stpaChildren.concat([
            ...filteredModel.responsibilities?.map(r => r.responsiblitiesForOneSystem.map(resp => this.generateAspectWithEdges(resp, args))).flat(2),
            ...filteredModel.allUCAs?.map(allUCA => allUCA.ucas.map(uca => this.generateAspectWithEdges(uca, args))).flat(2),
            ...filteredModel.rules?.map(rule => rule.contexts.map(context => this.generateAspectWithEdges(context, args))).flat(2),
            ...filteredModel.controllerConstraints?.map(c => this.generateAspectWithEdges(c, args)).flat(1),
            ...filteredModel.scenarios?.map(s => this.generateAspectWithEdges(s, args)).flat(1),
            ...filteredModel.safetyCons?.map(sr => this.generateAspectWithEdges(sr, args)).flat(1)
        ]);


        // filtering the nodes of the STPA graph
        const stpaNodes: STPANode[] = [];
        for (const node of stpaChildren) {
            if (node.type === STPA_NODE_TYPE) {
                stpaNodes.push(node as STPANode);
            }
        }
        // each node should be placed in a specific layer based on the aspect. therefore positions must be set
        setLevelsForSTPANodes(stpaNodes, this.options.getGroupingUCAs());

        const rootChildren: SModelElement[] = [];
        if (filteredModel.controlStructure) {
            // determine the nodes of the control structure graph
            const csNodes = filteredModel.controlStructure?.nodes.map(n => this.generateCSNode(n, args));
            // children (nodes and edges) of the control structure
            const CSChildren = [
                ...csNodes,
                ...this.generateVerticalCSEdges(filteredModel.controlStructure.nodes, args),
                //...this.generateHorizontalCSEdges(filteredModel.controlStructure.edges, args)
            ];
            // add control structure to roots children
            rootChildren.push({
                type: PARENT_TYPE,
                id: 'controlStructure',
                children: CSChildren
            });
        }
        // add relationship graph to roots children
        rootChildren.push(
            {
                type: PARENT_TYPE,
                id: 'relationships',
                children: stpaChildren
            }
        );
        // return root
        return {
            type: 'graph',
            id: 'root',
            children: rootChildren
        };
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
        }
        return edges;
    }

    /**
     * Translates the commands (control action or feedback) of a node to edges.
     * @param commands The control actions or feedback of a node.
     * @param edgetype The type of the edge (control action or feedback).
     * @param args GeneratorContext of the STPA model.
     * @returns A list of edges representing the commands.
     */
    protected translateCommandsToEdges(commands: VE[], edgetype: EdgeType, args: GeneratorContext<Model>): CSEdge[] {
        const idCache = args.idCache;
        const edges: CSEdge[] = [];
        for (const edge of commands) {
            const sourceId = idCache.getId(edge.$container);
            const targetId = idCache.getId(edge.target.ref);
            const edgeId = idCache.uniqueId(`${sourceId}:${edge.comms[0].name}:${targetId}`, edge);
            // multiple commands to same target is represented by one edge
            const label: string[] = [];
            for (let i = 0; i < edge.comms.length; i++) {
                const com = edge.comms[i];
                label.push(com.label);
            }
            const e = this.generateControlStructureEdge(edgeId, sourceId ? sourceId : '', targetId ? targetId : '',
                label, edgetype, args);
            edges.push(e);
        }
        return edges;
    }

    /**
     * Translates the inputs or outputs of a node to edges.
     * @param io The inputs or outputs of a node.
     * @param node The node of the inputs or outputs.
     * @param edgetype The type of the edge (input or output).
     * @param args GeneratorContext of the STPA model.
     * @returns a list of edges representing the inputs or outputs.
     */
    protected translateIOToEdgeAndNode(io: Command[], node: Node, edgetype: EdgeType, args: GeneratorContext<Model>): (CSNode | CSEdge)[] {
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
                    const inputDummyNode = this.generateDummyNode(node.level - 1, "input" + node.name, idCache);
                    // create edge for the input
                    const inputEdge = this.generateControlStructureEdge(idCache.uniqueId(`${inputDummyNode.id}:input:${nodeId}`), inputDummyNode.id ? inputDummyNode.id : '', nodeId ? nodeId : '',
                        label, edgetype, args);
                    graphComponents = [inputEdge, inputDummyNode];
                    break;
                case EdgeType.OUTPUT:
                    // create dummy node for the output
                    const outputDummyNode = this.generateDummyNode(node.level + 1, "output" + node.name, idCache);
                    // create edge for the output
                    const outputEdge = this.generateControlStructureEdge(idCache.uniqueId(`${nodeId}:output:${outputDummyNode.id}`), nodeId ? nodeId : '', outputDummyNode.id ? outputDummyNode.id : '',
                        label, edgetype, args);
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

    /*     private generateHorizontalCSEdges(edges: Edge[], args: GeneratorContext<Model>): SEdge[]{
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
     * Generates a single control structure edge based on the gven arguments.
     * @param edgeId The ID of the edge that should be created.
     * @param sourceId The ID of the source of the edge.
     * @param targetId The ID of the target of the edge.
     * @param label The labels of the edge.
     * @param edgeType The type of the edge (control action or feedback edge).
     * @param param5 GeneratorContext of the STPA model.
     * @returns A control structure edge.
     */
    protected generateControlStructureEdge(edgeId: string, sourceId: string, targetId: string, label: string[], edgeType: EdgeType, args: GeneratorContext<Model>): CSEdge {
        const children: SModelElement[] = this.generateLabel(label, edgeId, args);
        return {
            type: CS_EDGE_TYPE,
            id: edgeId,
            sourceId: sourceId!,
            targetId: targetId!,
            edgeType: edgeType,
            children: children
        };
    }

    /**
     * Generates SLabel elements for the given {@code label}.
     * @param label Labels to translate to SLabel elements.
     * @param id The ID of the element for which the label should be generated.
     * @returns SLabel elements representing {@code label}.
     */
    protected generateLabel(label: string[], id: string, { idCache }: GeneratorContext<Model>): SLabel[] {
        const children: SLabel[] = [];
        if (label.find(l => l !== '')) {
            label.forEach(l => {
                children.push({
                    type: 'label:xref',
                    id: idCache.uniqueId(id + '.label'),
                    text: l
                } as SLabel);
            });
        } else {
            // needed for correct layout
            children.push({
                type: 'label:xref',
                id: idCache.uniqueId(id + '.label'),
                text: ' '
            } as SLabel);

        }
        return children;
    }

    /**
     * Generates a single control structure node for the given {@code node},
     * @param node The system component a CSNode should be created for.
     * @param param1 GeneratorContext of the STPA model.
     * @returns A CSNode representing {@code node}.
     */
    private generateCSNode(node: Node, { idCache }: GeneratorContext<Model>): CSNode {
        const label = node.label ? node.label : node.name;
        const nodeId = idCache.uniqueId(node.name, node);
        return {
            type: CS_NODE_TYPE,
            id: nodeId,
            level: node.level,
            children: [
                <SLabel>{
                    type: 'label',
                    id: idCache.uniqueId(nodeId + '.label'),
                    text: label
                }
            ],
            layout: 'stack',
            layoutOptions: {
                paddingTop: 10.0,
                paddingBottom: 10.0,
                paddngLeft: 10.0,
                paddingRight: 10.0
            }
        };
    }

    /**
     * Generates a dummy node for the given {@code level}.
     * @param level The level of the dummy node.
     * @param idCache The ID cache of the STPA model.
     * @returns a dummy node.
     */
    protected generateDummyNode(level: number, name: string, idCache: IdCache<AstNode>): CSNode {
        const id = idCache.uniqueId('dummy' + name);
        return {
            type: DUMMY_NODE_TYPE,
            id: id,
            level: level,
            layout: 'stack',
            layoutOptions: {
                paddingTop: 10.0,
                paddingBottom: 10.0,
                paddngLeft: 10.0,
                paddingRight: 10.0
            }
        };
    }

    /**
     * Generates a node and the edges for the given {@code node}.
     * @param node STPA component for which a node and edges should be generated.
     * @param args GeneratorContext of the STPA model.
     * @returns A node representing {@code node} and edges representing the references {@code node} contains.
     */
    private generateAspectWithEdges(node: AstNode, args: GeneratorContext<Model>): SModelElement[] {
        // node must be created first in order to access the id when creating the edges
        const stpaNode = this.generateSTPANode(node, args);
        // uca nodes need to save their control action in order to be able to group them by the actions
        if ((isUCA(node) || isContext(node)) && node.$container.system.ref) {
            stpaNode.controlAction = node.$container.system.ref.name + "." + node.$container.action.ref?.name;
        }
        const elements: SModelElement[] = this.generateEdgesForSTPANode(node, args);
        elements.push(stpaNode);
        return elements;
    }

    /**
     * Generates the edges for {@code node}.
     * @param node STPA component for which the edges should be created.
     * @param args GeneratorContext of the STPA model.
     * @returns Edges representing the references {@code node} contains.
     */
    private generateEdgesForSTPANode(node: AstNode, args: GeneratorContext<Model>): SModelElement[] {
        const idCache = args.idCache;
        const elements: SModelElement[] = [];
        const sourceId = idCache.getId(node);
        // for every reference an edge is created
        // if hierarchy option is false, edges from subcomponents to parents are created too
        const targets = getTargets(node, this.options.getHierarchy());
        for (const target of targets) {
            const targetId = idCache.getId(target);
            const edgeId = idCache.uniqueId(`${sourceId}:-:${targetId}`, undefined);
            if (sourceId && targetId) {
                const e = this.generateSTPAEdge(edgeId, node, sourceId, target, '', args);
                elements.push(e);
            }
        }
        return elements;
    }

    /**
     * Generates a single STPAEdge based on the given arguments.
     * @param edgeId The ID of the edge that should be created.
     * @param sourceId The ID of the source of the edge.
     * @param target The target of the edge.
     * @param label The label of the edge.
     * @param param4 GeneratorContext of the STPA model.
     * @returns An STPAEdge.
     */
    private generateSTPAEdge(edgeId: string, source: AstNode, sourceId: string, target: AstNode, label: string, { idCache }: GeneratorContext<Model>): STPAEdge {
        const targetId = idCache.getId(target);
        let children: SModelElement[] = [];
        if (label !== '') {
            children = [
                <SLabel>{
                    type: 'label:xref',
                    id: idCache.uniqueId(edgeId + '.label'),
                    text: label
                }
            ];
        }

        if ((isHazard(target) || isSystemConstraint(target)) && target.$container?.$type !== 'Model') {
            // if the target is a subcomponent we need to add ports to route the edges correctly
            return this.generateEdgeWithIntermediatePorts(target, source, sourceId, edgeId, children, idCache);
        } else {
            // we need to add ports for source and target
            const sourceNode = this.idToSNode.get(sourceId);
            const sourcePortId = idCache.uniqueId(edgeId + '.newTransition');
            sourceNode?.children?.push(
                <STPAPort>{
                    type: STPA_PORT_TYPE,
                    side: PortSide.NORTH,
                    id: sourcePortId
                }
            );
            const targetNode = this.idToSNode.get(targetId!);
            const targetPortId = idCache.uniqueId(edgeId + '.newTransition');
            targetNode?.children?.push(
                <STPAPort>{
                    type: STPA_PORT_TYPE,
                    side: PortSide.SOUTH,
                    id: targetPortId
                }
            );
            return {
                type: STPA_EDGE_TYPE,
                id: edgeId,
                sourceId: sourcePortId,
                targetId: targetPortId,
                aspect: getAspect(source),
                children: children
            };
        }
    }

    protected generateEdgeWithIntermediatePorts(target: AstNode, source: AstNode, sourceId: string, edgeId: string, children: SModelElement[], idCache: IdCache<AstNode>): STPAEdge {
        let parent: AstNode | undefined = target;
        const ids: string[] = [];
        // add ports to the nodes
        while (parent && parent?.$type !== 'Model') {
            const current = parent;
            const currentId = idCache.getId(current);
            const currentNode = this.idToSNode.get(currentId!);
            const portId = idCache.uniqueId(edgeId + '.newTransition');
            currentNode?.children?.push(
                <STPAPort>{
                    type: STPA_PORT_TYPE,
                    side: PortSide.SOUTH,
                    id: portId
                }
            );
            ids.push(portId);
            parent = parent?.$container;
        }

        // add port for source node
        const sourceNode = this.idToSNode.get(sourceId);
        const sourcePortId = idCache.uniqueId(edgeId + '.newTransition');
        sourceNode?.children?.push(
            <STPAPort>{
                type: STPA_PORT_TYPE,
                side: PortSide.NORTH,
                id: sourcePortId
            }
        );

        // add edges between the ports
        let counter = 0;
        parent = target;
        while (parent && parent?.$type !== 'Model') {
            const parentId = idCache.getId(parent.$container);
            const parentNode = this.idToSNode.get(parentId!);
            const type = counter === 0 ? STPA_EDGE_TYPE : STPA_INTERMEDIATE_EDGE_TYPE;
            parentNode?.children?.push(
                {
                    type: type,
                    id: idCache.uniqueId(edgeId),
                    sourceId: ids[counter + 1],
                    targetId: ids[counter],
                    aspect: getAspect(source)
                } as STPAEdge
            );
            counter++;

            parent = parent?.$container;
        }

        // add edge from original source to port of top node
        return {
            type: STPA_INTERMEDIATE_EDGE_TYPE,
            id: edgeId,
            sourceId: sourcePortId,
            targetId: ids[ids.length - 1],
            aspect: getAspect(source),
            children: children
        };
    }

    /**
     * Generates a single STPANode for the given {@code node}.
     * @param node The STPA component the node should be created for.
     * @param args GeneratorContext of the STPA model.
     * @returns A STPANode representing {@code node}.
     */
    private generateSTPANode(node: AstNode, args: GeneratorContext<Model>): STPANode {
        const idCache = args.idCache;
        if (isLoss(node) || isHazard(node) || isSystemConstraint(node) || isContConstraint(node) || isLossScenario(node)
            || isSafetyConstraint(node) || isResponsibility(node) || isUCA(node) || isContext(node)) {
            const nodeId = idCache.uniqueId(node.name, node);
            // determines the hierarchy level for subcomponents. For other components the value is 0.
            let lvl = 0;
            let container = node.$container;
            while (isHazard(container) || isSystemConstraint(container)) {
                lvl++;
                container = container.$container;
            }

            let children: SModelElement[] = [
                <SLabel>{
                    type: 'label',
                    id: idCache.uniqueId(nodeId + '.label'),
                    text: node.name
                }
            ];
            // if the hierarchy option is true, the subcomponents are added as children to the parent
            if (this.options.getHierarchy() && (isHazard(node) && node.subComps.length !== 0)) {
                // adds subhazards
                children = children.concat(node.subComps?.map((sc: AstNode) => this.generateSTPANode(sc, args)));
            }
            if (this.options.getHierarchy() && isSystemConstraint(node) && node.subComps.length !== 0) {
                // adds subconstraints
                children = children.concat(node.subComps?.map((sc: AstNode) => this.generateSTPANode(sc, args)));
            }

            if (isContext(node)) {
                // context UCAs have no description
                const result = {
                    type: STPA_NODE_TYPE,
                    id: nodeId,
                    aspect: getAspect(node),
                    description: "",
                    hierarchyLvl: lvl,
                    children: children,
                    layout: 'stack',
                    layoutOptions: {
                        paddingTop: 10.0,
                        paddingBottom: 10.0,
                        paddngLeft: 10.0,
                        paddingRight: 10.0
                    }
                };
                this.idToSNode.set(nodeId, result);
                return result;
            } else {
                const result = {
                    type: STPA_NODE_TYPE,
                    id: nodeId,
                    aspect: getAspect(node),
                    description: node.description,
                    hierarchyLvl: lvl,
                    children: children,
                    layout: 'stack',
                    layoutOptions: {
                        paddingTop: 10.0,
                        paddingBottom: 10.0,
                        paddngLeft: 10.0,
                        paddingRight: 10.0
                    }
                };
                this.idToSNode.set(nodeId, result);
                return result;
            }
        } else {
            throw new Error("generateSTPANode method should only be called with an STPA component");
        }
    }

}