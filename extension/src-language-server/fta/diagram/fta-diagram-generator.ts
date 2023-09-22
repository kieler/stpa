/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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
import { SLabel, SModelElement, SModelRoot } from "sprotty-protocol";
import { ModelFTA, isComponent, isCondition, isKNGate } from "../../generated/ast";
import { FtaServices } from "../fta-module";
import { namedFtaElement } from "../utils";
import { FTAEdge, FTANode } from "./fta-interfaces";
import { FTA_EDGE_TYPE, FTA_NODE_TYPE } from "./fta-model";
import { getFTNodeType, getTargets } from "./utils";

export class FtaDiagramGenerator extends LangiumDiagramGenerator {
    constructor(services: FtaServices) {
        super(services);
    }

    /**
     * Generates an SGraph for the FTA model contained in {@code args}.
     * @param args GeneratorContext for the FTA model.
     * @returns the root of the generated SGraph.
     */
    protected generateRoot(args: GeneratorContext<ModelFTA>): SModelRoot {
        const { document } = args;
        const model = document.parseResult.value;
        const idCache = args.idCache;

        const ftaChildren: SModelElement[] = [
            // create nodes for top event, components, conditions, and gates
            this.generateFTNode(model.topEvent, idCache),
            ...model.components.map((component) => this.generateFTNode(component, idCache)),
            ...model.conditions.map((condition) => this.generateFTNode(condition, idCache)),
            ...model.gates.map((gate) => this.generateFTNode(gate, idCache)),
            // create edges for the gates and the top event
            ...model.gates.map((gate) => this.generateEdges(gate, idCache)).flat(1),
            ...this.generateEdges(model.topEvent, idCache),
        ];

        return {
            type: "graph",
            id: "root",
            children: ftaChildren,
        };
    }

    /**
     * Generates the edges for the given {@code node}.
     * @param node FTA component for which the edges should be created.
     * @param idCache The ID cache of the FTA model.
     * @returns edges representing the references the given {@code node} contains.
     */
    private generateEdges(node: AstNode, idCache: IdCache<AstNode>): SModelElement[] {
        const elements: SModelElement[] = [];
        const sourceId = idCache.getId(node);
        // for every reference an edge is created
        const targets = getTargets(node);
        for (const target of targets) {
            const targetId = idCache.getId(target);
            const edgeId = idCache.uniqueId(`${sourceId}_${targetId}`, undefined);
            if (sourceId && targetId) {
                const e = this.generateFTEdge(edgeId, sourceId, targetId, idCache);
                elements.push(e);
            }
        }
        return elements;
    }

    /**
     * Generates a single FTAEdge based on the given arguments.
     * @param edgeId The ID of the edge that should be created.
     * @param sourceId The ID of the source of the edge.
     * @param targetId The ID of the target of the edge.
     * @param idCache The ID cache of the FTA model.
     * @param label The label of the edge.
     * @returns an FTAEdge.
     */
    private generateFTEdge(
        edgeId: string,
        sourceId: string,
        targetId: string,
        idCache: IdCache<AstNode>,
        label?: string
    ): FTAEdge {
        const children = label ? this.createEdgeLabel(label, edgeId, idCache): [];
        return {
            type: FTA_EDGE_TYPE,
            id: edgeId,
            sourceId: sourceId,
            targetId: targetId,
            children: children,
            highlight: true,
        };
    }

    /**
     * Generates a single FTANode for the given {@code node}.
     * @param node The FTA component the node should be created for.
     * @param idCache The ID cache of the FTA model.
     * @returns a FTANode representing {@code node}.
     */
    private generateFTNode(node: namedFtaElement, idCache: IdCache<AstNode>): FTANode {
        const nodeId = idCache.uniqueId(node.name, node);
        const children: SModelElement[] = this.createNodeLabel(node.name, nodeId, idCache);
        const description = isComponent(node) || isCondition(node) ? node.description : "";

        const ftNode = {
            type: FTA_NODE_TYPE,
            id: nodeId,
            name: node.name,
            nodeType: getFTNodeType(node),
            description: description,
            children: children,
            highlight: true,
            layout: "stack",
            layoutOptions: {
                paddingTop: 10.0,
                paddingBottom: 10.0,
                paddngLeft: 10.0,
                paddingRight: 10.0,
            },
        } as FTANode;

        if (isKNGate(node)) {
            ftNode.k = node.k;
            ftNode.n = node.children.length;
        }
        return ftNode;
    }

    /**
     * Generates SLabel element for the given {@code label} of a node.
     * @param label Label to translate to SLabel element.
     * @param id The ID of the element for which the label should be generated.
     * @param idCache The ID cache of the FTA model.
     * @returns SLabel element representing {@code label}.
     */
    protected createNodeLabel(label: string, id: string, idCache: IdCache<AstNode>): SLabel[] {
        return [
            <SLabel>{
                type: "label",
                id: idCache.uniqueId(id + ".label"),
                text: label,
            },
        ];
    }

    /**
     * Generates SLabel element for the given {@code label} of an edge.
     * @param label Label to translate to SLabel element.
     * @param id The ID of the element for which the label should be generated.
     * @param idCache The ID cache of the FTA model.
     * @returns SLabel element representing {@code label}.
     */
    protected createEdgeLabel(label: string, id: string, idCache: IdCache<AstNode>): SLabel[] {
        return [
            <SLabel>{
                type: "label:xref",
                id: idCache.uniqueId(id + ".label"),
                text: label,
            },
        ];
    }
}
