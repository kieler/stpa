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

import { AstNode, documentFromText, LangiumParser, ParseResult } from 'langium';
import { GeneratorContext, IdCache, IdCacheImpl } from 'langium-sprotty';
import { SModelRoot, SLabel, SModelElement } from 'sprotty-protocol';
import {
    isContConstraint, isHazard, isLoss, isLossScenario, isResponsibility, isSafetyConstraint,
    isSystemConstraint, isUCA, Model, Node
} from './generated/ast';
import { CSEdge, CSNode, STPANode, STPAEdge } from './stpa-interfaces';
import { PARENT_TYPE, EdgeDirection, CS_EDGE_TYPE, CS_NODE_TYPE, STPA_NODE_TYPE, STPA_EDGE_TYPE } from './stpa-model';
import { StpaServices } from './stpa-module';
import { collectElementsWithSubComps, filterDanglingEdges, getAspect, getTargets, setPositionsForCSNodes, setPositionsForSTPANodes } from './utils';
import { StpaSynthesisOptions } from './options/synthesis-options';
import { LanguageTemplate, TemplateGraphGenerator } from './templates/template-model';
import { CancellationToken } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { StpaDocumentBuilder } from './stpa-document-builder';

export class StpaDiagramGenerator extends TemplateGraphGenerator {

    protected readonly options: StpaSynthesisOptions;
    protected readonly parser: LangiumParser;
    protected readonly docBuilder: StpaDocumentBuilder;
    protected readonly languageId: string;
    protected idCache: IdCache<AstNode>;

    constructor(services: StpaServices) {
        super(services);
        this.options = services.options.StpaSynthesisOptions;
        this.parser = services.parser.LangiumParser;
        this.docBuilder = services.shared.workspace.DocumentBuilder as StpaDocumentBuilder;
        this.languageId = services.LanguageMetaData.languageId;
    }

    /**
     * Generates an SGraph for the given {@code template}.
     * @param template The template for which a graph should be generated.
     * @returns the SGraph.
     */
    async generateTemplateRoot(template: LanguageTemplate): Promise<SModelRoot | undefined> {
        // in order for the cross-references to be correctly evaluated, a document must be build
        const uri = 'file:///template.stpa';
        const textDocument = TextDocument.create(uri, this.languageId, 0, template.baseCode ?? '');
        const parseResult: ParseResult<Model> = this.parser.parse<Model>(template.baseCode);
        if (parseResult.parserErrors.length > 0) {
            return undefined;
        }
        const doc = documentFromText<Model>(textDocument, parseResult);
        await this.docBuilder.buildDocuments([doc], CancellationToken.None);

        if (!this.idCache) {
            this.idCache = new IdCacheImpl();
        }
        const graph = this.generateGraph(doc.parseResult.value);
        if (graph.children) {
            graph.children = filterDanglingEdges(graph.children);
        }
        graph.id = template.id;
        return graph;
    }


    /**
     * Generates a SGraph for the STPA model contained in {@code args}.
     * @param args GeneratorContext for the STPA model.
     * @returns the root of the generated SGraph.
     */
    protected generateRoot(args: GeneratorContext<Model>): SModelRoot {
        const { document } = args;
        const model: Model = document.parseResult.value;
        if (!this.idCache) {
            this.idCache = args.idCache;
        }
        return this.generateGraph(model);
    }

    /**
     * Generates an SGraph for the given {@code model}.
     * @param model The Model for whcih a graph should be generated.
     * @returns an SGraph.
     */
    private generateGraph(model: Model): SModelRoot {
        // determine the children for the STPA graph
        // for each component a node is generated with edges representing the references of the component
        // in order to be able to set the target IDs of the edges, the nodes must be created in the correct order
        let stpaChildren: SModelElement[] = model.losses?.map(l => this.generateSTPANode(l));
        // the hierarchy option determines whether subcomponents are contained in ther parent or not
        if (!this.options.getHierarchy()) {
            // subcomponents have edges to the parent
            const hazards = collectElementsWithSubComps(model.hazards);
            const sysCons = collectElementsWithSubComps(model.systemLevelConstraints);
            stpaChildren = stpaChildren.concat([
                ...hazards.map(sh => this.generateAspectWithEdges(sh)).flat(1),
                ...sysCons.map(ssc => this.generateAspectWithEdges(ssc)).flat(1)
            ]);
        } else {
            // subcomponents are contained in the parent
            stpaChildren = stpaChildren.concat([
                ...model.hazards?.map(h => this.generateAspectWithEdges(h)).flat(1),
                ...model.systemLevelConstraints?.map(sc => this.generateAspectWithEdges(sc)).flat(1),
                ...model.systemLevelConstraints?.map(sc => sc.subComps?.map(ssc => this.generateEdgesForSTPANode(ssc))).flat(2)
            ]);
        }
        stpaChildren = stpaChildren.concat([
            ...model.responsibilities?.map(r => r.responsiblitiesForOneSystem.map(resp => this.generateAspectWithEdges(resp))).flat(2),
            ...model.allUCAs?.map(allUCA => allUCA.ucas.map(uca => this.generateAspectWithEdges(uca))).flat(2),
            ...model.controllerConstraints?.map(c => this.generateAspectWithEdges(c)).flat(1),
            ...model.scenarios?.map(s => this.generateAspectWithEdges(s)).flat(1),
            ...model.safetyCons?.map(sr => this.generateAspectWithEdges(sr)).flat(1)
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

        const graphChildren = [];

        if (model.controlStructure) {
            // determine the nodes of the control structure graph
            const csNodes = model.controlStructure?.nodes.map(n => this.generateCSNode(n));
            // each node should be placed in a specifc layer based on the hierarchy level. therefore positions must be set
            setPositionsForCSNodes(csNodes);
            // children (nodes and edges) of the control structure
            const CSChildren = [
                ...csNodes,
                ...this.generateVerticalCSEdges(model.controlStructure.nodes),
                //...this.generateHorizontalCSEdges(model.controlStructure.edges, args)
            ];
            graphChildren.push({
                type: PARENT_TYPE,
                id: 'controlStructure',
                children: CSChildren
            });
        }
        if (stpaChildren.length !== 0) {
            graphChildren.push({
                type: PARENT_TYPE,
                id: 'relationships',
                children: stpaChildren
            });
        }
        // SGraph containing the relationship graph and the control structure if they exist
        return {
            type: 'graph',
            id: 'root',
            children: graphChildren
        };
    }

    /**
     * Creates the edges for the control structure.
     * @param nodes The nodes of the control structure.
     * @param args GeneratorCOntext of the STPA model
     * @returns A list of edges for the control structure.
     */
    private generateVerticalCSEdges(nodes: Node[]): CSEdge[] {
        let edges: CSEdge[] = [];
        // for every control action and feedback of every a node, a edge should be created
        for (const node of nodes) {
            // create edges representing the control actions
            for (const edge of node.actions) {
                const sourceId = this.idCache.getId(edge.$container);
                const targetId = this.idCache.getId(edge.target.ref);
                const edgeId = this.idCache.uniqueId(`${sourceId}:${edge.comms[0].name}:${targetId}`, edge);
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
                    label, EdgeDirection.DOWN);
                edges.push(e);
            }
            // create edges representing feedback
            for (const edge of node.feedbacks) {
                const sourceId = this.idCache.getId(edge.$container);
                const targetId = this.idCache.getId(edge.target.ref);
                const edgeId = this.idCache.uniqueId(`${sourceId}:${edge.comms[0].name}:${targetId}`, edge);
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
                    label, EdgeDirection.UP);
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
    private generateCSEdge(edgeId: string, sourceId: string, targetId: string, label: string, direction: EdgeDirection): CSEdge {
        // needed for correct layout
        label = label === '' ? ' ' : label;
        return {
            type: CS_EDGE_TYPE,
            id: edgeId,
            sourceId: sourceId!,
            targetId: targetId!,
            direction: direction,
            children: [
                <SLabel>{
                    type: 'label:xref',
                    id: this.idCache.uniqueId(edgeId + '.label'),
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
    private generateCSNode(node: Node): CSNode {
        const label = node.label ? node.label : node.name;
        const nodeId = this.idCache.uniqueId(node.name, node);
        return {
            type: CS_NODE_TYPE,
            id: nodeId,
            level: node.level,
            children: [
                <SLabel>{
                    type: 'label',
                    id: this.idCache.uniqueId(nodeId + '.label'),
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
    private generateAspectWithEdges(node: AstNode): SModelElement[] {
        // node must be created first in order to access the id when creating the edges
        const stpaNode = this.generateSTPANode(node);
        const elements: SModelElement[] = this.generateEdgesForSTPANode(node);
        elements.push(stpaNode);
        return elements;
    }

    /**
     * Generates the edges for {@code node}.
     * @param node STPA component for which the edges should be created.
     * @param args GeneratorContext of the STPA model.
     * @returns Edges representing the references {@code node} contains.
     */
    private generateEdgesForSTPANode(node: AstNode): SModelElement[] {
        const elements: SModelElement[] = [];
        const sourceId = this.idCache.getId(node);
        // for every reference an edge is created
        // if hierarchy option is false, edges from subcomponents to parents are created too
        const targets = getTargets(node, this.options.getHierarchy());
        for (const target of targets) {
            let targetId = this.idCache.getId(target);
            const edgeId = this.idCache.uniqueId(`${sourceId}:-:${targetId}`, undefined);
            if (sourceId && targetId) {
                const e = this.generateSTPAEdge(edgeId, sourceId, targetId, '');
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
    private generateSTPAEdge(edgeId: string, sourceId: string, targetId: string, label: string): STPAEdge {
        let children: SModelElement[] = [];
        if (label !== '') {
            children = [
                <SLabel>{
                    type: 'label:xref',
                    id: this.idCache.uniqueId(edgeId + '.label'),
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
    private generateSTPANode(node: AstNode): STPANode {
        if (isLoss(node) || isHazard(node) || isSystemConstraint(node) || isContConstraint(node) || isLossScenario(node)
            || isSafetyConstraint(node) || isResponsibility(node) || isUCA(node)) {
            const nodeId = this.idCache.uniqueId(node.name, node);
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
                    id: this.idCache.uniqueId(nodeId + '.label'),
                    text: node.name
                }
            ];
            // if the hierarchy option is true, the subcomponents are added as children to the parent
            if (this.options.getHierarchy() && (isHazard(node) && node.subComps.length !== 0)) {
                // adds subhazards
                children = children.concat(node.subComps?.map((sc: AstNode) => this.generateSTPANode(sc)));
            }
            if (this.options.getHierarchy() && isSystemConstraint(node) && node.subComps.length !== 0) {
                // adds subconstraints
                children = children.concat(node.subComps?.map((sc: AstNode) => this.generateSTPANode(sc)));
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