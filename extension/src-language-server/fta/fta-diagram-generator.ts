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

import { AstNode } from 'langium';
import { GeneratorContext, LangiumDiagramGenerator } from 'langium-sprotty';
import { SLabel, SModelElement, SModelRoot } from 'sprotty-protocol';
import { Component, Condition, Gate, ModelFTA, TopEvent, isComponent, isCondition, isGate, isKNGate } from '../generated/ast';
import { FTAEdge, FTANode } from './fta-interfaces';
import { FTA_EDGE_TYPE, FTA_NODE_TYPE, TREE_TYPE } from './fta-model';
import { FtaServices } from './fta-module';
import { getAllGateTypes, getFTNodeType, getTargets } from './fta-utils';


export class FtaDiagramGenerator extends LangiumDiagramGenerator{

    allNodes:AstNode[];
    //allEdges:FTAEdge[];
    constructor(services: FtaServices){
        super(services);
    }

    /**
     * Generates an SGraph for the FTA model contained in {@code args}.
     * @param args GeneratorContext for the FTA model.
     * @returns the root of the generated SGraph.
     */
    protected generateRoot(args: GeneratorContext<ModelFTA>): SModelRoot {
        const { document } = args;
        const model: ModelFTA = document.parseResult.value;
        //set filter for later maybe


        let ftaChildren: SModelElement[] = model.components?.map(comps => this.generateFTANode(comps, args));

        //returns a Map with the gate types as the key and all instances of that type as the value.
        const allGates: Map<string, AstNode[]> = getAllGateTypes(model.gates);

        //first create the ftaNode for the topevent, conditions and all gates
        ftaChildren = ftaChildren.concat([
            this.generateFTANode(model.topEvent, args),
            ...model.conditions?.map(cond => this.generateFTANode(cond,args)).flat(1)
        ]);
        
        allGates.forEach((value:AstNode[]) => {
            ftaChildren = ftaChildren.concat([
                ...value?.map(gates => this.generateFTANode(gates as Gate,args)).flat(1), 
            ]);
        });

        //after that create the edges of the gates and the top event
        allGates.forEach((value:AstNode[]) => {
            ftaChildren = ftaChildren.concat([
                ...value?.map(gates => this.generateEdgesForFTANode(gates,args)).flat(1), 
            ]);
        });

        ftaChildren = ftaChildren.concat([...this.generateEdgesForFTANode(model.topEvent, args),]);



         // filtering the nodes of the FTA graph
        /* const ftaNodes: FTANode[] = [];
        for (const node of ftaChildren) {
            if (node.type === FTA_NODE_TYPE) {
                ftaNodes.push(node as FTANode);
            }
        }
        const ftaEdges:FTAEdge[] = [];
        for(const edge of ftaChildren){
            if(edge.type === FTA_EDGE_TYPE){
                ftaEdges.push(edge as FTAEdge);
            }
        } 
        this.allNodes = ftaNodes;
        this.allEdges = ftaEdges; */

        this.allNodes = model.components;
        this.allNodes = this.allNodes.concat(model.topEvent, ...model.conditions);
        allGates.forEach((value:AstNode[]) => {
            this.allNodes = this.allNodes.concat(...value);
        });
        
             
        return {
            type: 'graph',
            id: 'root',
            children: [
                {
                    type: TREE_TYPE,
                    id: 'faultTree',
                    children: ftaChildren
                }
            ]
        };
        
    }
    
    /**
     * Getter method for every FTANode in the Fault Tree.
     * @returns every FTANode in the Fault Tree.
     */
    public getNodes():AstNode[]{
        return this.allNodes;
    }
    /* public getEdges():FTAEdge[]{
        return this.allEdges;
    } */
    

    /**
     * Generates the edges for {@code node}.
     * @param node FTA component for which the edges should be created.
     * @param args GeneratorContext of the FTA model.
     * @returns edges representing the references {@code node} contains.
     */
    private generateEdgesForFTANode(node: AstNode, args: GeneratorContext<ModelFTA>): SModelElement[] {
        const idCache = args.idCache;
        const elements: SModelElement[] = [];
        const sourceId = idCache.getId(node);
        // for every reference an edge is created
        const targets = getTargets(node);
        for (const target of targets) {
            const targetId = idCache.getId(target);
            const edgeId = idCache.uniqueId(`${sourceId}:-:${targetId}`, undefined);
            if (sourceId && targetId) {
                const e = this.generateFTAEdge(edgeId, sourceId, targetId, '', args);
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
     * @param label The label of the edge.
     * @param param4 GeneratorContext of the FTA model.
     * @returns an FTAEdge.
     */
    private generateFTAEdge(edgeId: string, sourceId: string, targetId: string, label: string, { idCache }: GeneratorContext<ModelFTA>): FTAEdge {
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
     * @param args GeneratorContext of the FTA model.
     * @returns a FTANode representing {@code node}.
     */
    private generateFTANode(node: TopEvent | Gate | Component | Condition, args: GeneratorContext<ModelFTA>): FTANode {
        const idCache = args.idCache;
        
        const nodeId = idCache.uniqueId(node.name, node);

        const children: SModelElement[] = [
            <SLabel>{
                type: 'label',
                id: idCache.uniqueId(nodeId + '.label'),
                text: node.name
            }
        ];

        let desc = "";
        if(isComponent(node) || isCondition(node)){
            desc = node.description;
        }


        if(isGate(node) && isKNGate(node.type)){
            return {
                type: FTA_NODE_TYPE,
                id: nodeId,
                nodeType: getFTNodeType(node),
                description: desc,
                children: children,
                highlight: true,
                k: node.type.k,
                n: node.type.children.length,
                layout: 'stack',
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddngLeft: 10.0,
                    paddingRight: 10.0
                }
            };
        }else{
            return {
                type: FTA_NODE_TYPE,
                id: nodeId,
                nodeType: getFTNodeType(node),
                description: desc,
                children: children,
                highlight: true,
                layout: 'stack',
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddngLeft: 10.0,
                    paddingRight: 10.0
                }
            };
        }
        
    }
}