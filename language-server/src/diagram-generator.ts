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
import { GeneratorContext, LangiumDiagramGenerator } from 'langium-sprotty';
import { SModelRoot, SLabel, SModelElement } from 'sprotty-protocol';
import { isContConstraint, isHazard, isLoss, isLossScenario, isResponsibility, isSafetyConstraint, 
    isSystemConstraint, isUCA, Model, Node } from './generated/ast';
import { CSEdge, CSNode, STPANode, STPAEdge } from './stpa-interfaces';
import { PARENT_TYPE, EdgeDirection, CS_EDGE_TYPE, CS_NODE_TYPE, STPA_NODE_TYPE, STPA_EDGE_TYPE } from './stpa-model';
import { StpaServices } from './stpa-module';
import { collectElementsWithSubComps, getAspect, getTargets, setPositionsForCSNodes, setPositionsForSTPANodes } from './utils';
import { StpaSynthesisOptions } from './options/synthesis-options';

export class StpaDiagramGenerator extends LangiumDiagramGenerator {

    protected readonly options: StpaSynthesisOptions;

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

        // determine the children for the STPA graph
        // for each component a node is generated with edges representing the references of the component
        // in order to be able to set the target IDs of the edges, the nodes must be created in the correct order
        let stpaChildren: SModelElement[] = model.losses?.map(l => this.generateSTPANode(l, args));
        // the hierarchy option determines whether subcomponents are contained in ther parent or not
        if (!this.options.getHierarchy()) {
            // subcomponents have edges to the parent
            const hazards = collectElementsWithSubComps(model.hazards);
            const sysCons = collectElementsWithSubComps(model.systemLevelConstraints);
            stpaChildren = stpaChildren.concat([
                    ...hazards.map(sh => this.generateAspectWithEdges(sh, args)).flat(1),
                    ...sysCons.map(ssc => this.generateAspectWithEdges(ssc, args)).flat(1)
                ]);
        } else {
            // subcomponents are contained in the parent
            stpaChildren = stpaChildren.concat([
                    ...model.hazards?.map(h => this.generateAspectWithEdges(h, args)).flat(1),
                    ...model.systemLevelConstraints?.map(sc => this.generateAspectWithEdges(sc, args)).flat(1),
                    ...model.systemLevelConstraints?.map(sc => sc.subComps?.map(ssc => this.generateEdgesForSTPANode(ssc, args))).flat(2)
                ]);
        }
        stpaChildren = stpaChildren.concat([
            ...model.responsibilities?.map(r => r.responsiblitiesForOneSystem.map(resp => this.generateAspectWithEdges(resp, args))).flat(2),
            ...model.allUCAs?.map(allUCA => allUCA.ucas.map(uca => this.generateAspectWithEdges(uca, args))).flat(2),
            ...model.controllerConstraints?.map(c => this.generateAspectWithEdges(c, args)).flat(1),
            ...model.scenarios?.map(s => this.generateAspectWithEdges(s, args)).flat(1),
            ...model.safetyCons?.map(sr => this.generateAspectWithEdges(sr, args)).flat(1)
        ]);

        // filtering the nodes of the STPA graph
        const stpaNodes: STPANode[] = [];
        for (const node of stpaChildren) {
            if (node.type === STPA_NODE_TYPE) {
                stpaNodes.push(node as STPANode);
            }
        }
        // each node should be placed in a specific layer based on the aspect. therefore positions must be set
        setPositionsForSTPANodes(stpaNodes);

        if (model.controlStructure) {
            // determine the nodes of the control structure graph
            const csNodes = model.controlStructure?.nodes.map(n => this.generateCSNode(n, args));
            // each node should be placed in a specifc layer based on the hierarchy level. therefore positions must be set
            setPositionsForCSNodes(csNodes);
            // children (nodes and edges) of the control structure
            const CSChildren= [
                ...csNodes,
                ...this.generateVerticalCSEdges(model.controlStructure.nodes, args),
                //...this.generateHorizontalCSEdges(model.controlStructure.edges, args)
            ];
            // SGraph containing the STPA graph and the control structure
            return {
                type: 'graph',
                id: 'root',
                children: [
                    {
                        type: PARENT_TYPE,
                        id: 'controlStructure',
                        children: CSChildren
                    },
                    {
                        type: PARENT_TYPE,
                        id: 'relationships',
                        children: stpaChildren
                    }
                ]
            };
        } else {
            // SGrpah containing the STPA graph
            return {
                type: 'graph',
                id: 'root',
                children: [
                    {
                        type: PARENT_TYPE,
                        id: 'relationships',
                        children: stpaChildren
                    }
                ]
            };
        }
    }
    
    /**
     * Creates the edges for the control structure.
     * @param nodes The nodes of the control structure.
     * @param args GeneratorCOntext of the STPA model
     * @returns A list of edges for the control structure.
     */
    private generateVerticalCSEdges(nodes: Node[], args: GeneratorContext<Model>): CSEdge[]{
        const idCache = args.idCache;
        let edges: CSEdge[] = [];
        // for every control action and feedback of every a node, a edge should be created
        for (const node of nodes) {
            // create edges representing the control actions
            for (const edge of node.actions) {
                const sourceId = idCache.getId(edge.$container);
                const targetId = idCache.getId(edge.target.ref);
                const edgeId = idCache.uniqueId(`${sourceId}:${edge.comms[0].name}:${targetId}`, edge);
                // multiple control actions to same target are represented by on edge
                let label = '';
                for (let i = 0; i < edge.comms.length; i++) {
                    const com = edge.comms[i];
                    label += com.label;
                    if (i < edge.comms.length - 1) {
                        label += ", ";
                    }
                }
                const e = this.generateCSEdge(edgeId, sourceId ? sourceId : '', targetId ? targetId : '', 
                                label, EdgeDirection.DOWN, args);
                edges.push(e);
            }
            // create edges representing feedback
            for (const edge of node.feedbacks) {
                const sourceId = idCache.getId(edge.$container);
                const targetId = idCache.getId(edge.target.ref);
                const edgeId = idCache.uniqueId(`${sourceId}:${edge.comms[0].name}:${targetId}`, edge);
                // multiple feedback to same target is represented by on edge
                let label = '';
                for (let i = 0; i < edge.comms.length; i++) {
                    const com = edge.comms[i];
                    label += com.label;
                    if (i < edge.comms.length - 1) {
                        label += ", ";
                    }
                }
                const e = this.generateCSEdge(edgeId, sourceId ? sourceId : '', targetId ? targetId : '', 
                                label, EdgeDirection.UP, args);
                edges.push(e);
            }
        }
        return edges;
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
     * @param label The label of the edge.
     * @param direction The direction of the edge.
     * @param param5 GeneratorContext of the STPA model.
     * @returns A control structure edge.
     */
    private generateCSEdge(edgeId: string, sourceId: string, targetId: string, label: string, direction: EdgeDirection, { idCache }: GeneratorContext<Model>): CSEdge {
        // needed for correct layout
        label = label === '' ? ' ' : label;
        return {
            type: CS_EDGE_TYPE,
            id: edgeId,
            sourceId: sourceId!,
            targetId: targetId!,
            direction: direction,
            children: [
                <SLabel> {
                    type: 'label:xref',
                    id: idCache.uniqueId(edgeId + '.label'),
                    text: label
                }
            ]
        };
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
     * Generates a node and the edges for the given {@code node}.
     * @param node STPA component for which a node and edges should be generated.
     * @param args GeneratorContext of the STPA model.
     * @returns A node representing {@code node} and edges representing the references {@code node} contains.
     */
    private generateAspectWithEdges(node: AstNode, args: GeneratorContext<Model>): SModelElement[] {
        // node must be created first in order to access the id when creating the edges
        const stpaNode = this.generateSTPANode(node, args);
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
            let targetId = idCache.getId(target);
            const edgeId = idCache.uniqueId(`${sourceId}:-:${targetId}`, undefined);
            if (sourceId && targetId) {
                const e = this.generateSTPAEdge(edgeId, sourceId, targetId, '', args);
                elements.push(e);
            }
        }
        return elements;
    }

    /**
     * Generates a single STPAEdge based on the given arguments.
     * @param edgeId The ID of the edge that should be created.
     * @param sourceId The ID of the source of the edge.
     * @param targetId The ID of the target of the edge.
     * @param label The label of the edge.
     * @param param4 GeneratorContext of the STPA model.
     * @returns An STPAEdge.
     */
    private generateSTPAEdge(edgeId: string, sourceId: string, targetId: string, label:string, { idCache }: GeneratorContext<Model>): STPAEdge {
        let children: SModelElement[] = [];
        if (label !== '') {
            children = [
                <SLabel> {
                    type: 'label:xref',
                    id: idCache.uniqueId(edgeId + '.label'),
                    text: label
                }
            ];
        }
        return {
            type: STPA_EDGE_TYPE,
            id: edgeId,
            sourceId: sourceId,
            targetId: targetId,
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
        if (isLoss(node)|| isHazard(node) || isSystemConstraint(node) || isContConstraint(node) || isLossScenario(node) 
                    || isSafetyConstraint(node) || isResponsibility(node) || isUCA(node)){
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

            return {
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
        } else {
            throw new Error("generateSTPANode method should only be called with an STPA component");
        }
    }

}