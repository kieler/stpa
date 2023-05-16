import { AstNode } from 'langium';
import { GeneratorContext, LangiumDiagramGenerator } from 'langium-sprotty';
import { SModelRoot, SLabel, SModelElement } from 'sprotty-protocol';
import { ModelFTA, isAND, isCommand, isComponent, isCondition, isGate, isInhibitGate, isKNGate, isOR, isTopEvent, AND } from '../generated/ast';
import { FtaServices } from './fta-module';
import { filterModel } from '../stpa/filtering';
import { FTAEdge, FTANode } from './fta-interfaces';
import { getAndGates, getAspect, getInhibitGates, getOrGates, getTargets, getkNGates, setLevelsForFTANodes } from './fta-utils';
import { FTA_EDGE_TYPE, FTA_NODE_TYPE, PARENT_TYPE } from './fta-model';


export class FtaDiagramGenerator extends LangiumDiagramGenerator{

    constructor(services: FtaServices){
        super(services);
    }

    /**
     * Generates a SGraph for the FTA model contained in {@code args}.
     * @param args GeneratorContext for the FTA model.
     * @returns the root of the generated SGraph.
     */
    protected generateRoot(args: GeneratorContext<ModelFTA>): SModelRoot {
        const { document } = args;
        const model: ModelFTA = document.parseResult.value;
        //set filter for later maybe
        const filteredModelFTA = model;

        //   let ftaChildren: SModelElement[] = this.generateAspectWithEdges(filteredModelFTA.topEvent, args);
        // Components first -> Gates -> Conditions -> Top Event
        let ftaChildren: SModelElement[] = filteredModelFTA.components?.map(l => this.generateFTANode(l, args));
        const andGates = getAndGates(filteredModelFTA.gates);           //all gates not listed in debug
        const orGates = getOrGates(filteredModelFTA.gates);             //aswell as edges missing
        const kNGates = getkNGates(filteredModelFTA.gates);
        const inhibitGates = getInhibitGates(filteredModelFTA.gates);
        ftaChildren = ftaChildren.concat([
            ...filteredModelFTA.conditions?.map(c => this.generateAspectWithEdges(c,args)).flat(1),
          //...filteredModelFTA.gates?.map(g => this.generateAspectWithEdges(g, args)).flat(1),
            ...andGates?.map(a => this.generateAspectWithEdges(a, args)).flat(1),
            ...orGates?.map(o => this.generateAspectWithEdges(o, args)).flat(1),
            ...kNGates?.map(k => this.generateAspectWithEdges(k, args)).flat(1),
            ...inhibitGates?.map(i => this.generateAspectWithEdges(i, args)).flat(1),
            ...this.generateAspectWithEdges(filteredModelFTA.topEvent, args),

        ]);


        // filtering the nodes of the FTA graph
        const ftaNodes: FTANode[] = [];
        for (const node of ftaChildren) {
            if (node.type === FTA_NODE_TYPE) {
                ftaNodes.push(node as FTANode);
            }
        }
        
       // give the top event the level 0
       setLevelsForFTANodes(ftaNodes);
        
        return {
            type: 'graph',
            id: 'root',
            children: [
                {
                    type: PARENT_TYPE,
                    id: 'relationships',
                    children: ftaChildren
                }
            ]
        };
        
    }

    /**
     * Generates a node and the edges for the given {@code node}.
     * @param node FTA component for which a node and edges should be generated.
     * @param args GeneratorContext of the FTA model.
     * @returns A node representing {@code node} and edges representing the references {@code node} contains.
     */
    private generateAspectWithEdges(node: AstNode, args: GeneratorContext<ModelFTA>): SModelElement[] {
        // node must be created first in order to access the id when creating the edges
        const ftaNode = this.generateFTANode(node, args);
        const elements: SModelElement[] = this.generateEdgesForFTANode(node, args);
        elements.push(ftaNode);
        return elements;
    }

    /**
     * Generates the edges for {@code node}.
     * @param node FTA component for which the edges should be created.
     * @param args GeneratorContext of the FTA model.
     * @returns Edges representing the references {@code node} contains.
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
     * @returns An FTAEdge.
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
            children: children
        };
    }

    /**
     * Generates a single FTANode for the given {@code node}.
     * @param node The FTA component the node should be created for.
     * @param args GeneratorContext of the FTA model.
     * @returns A FTANode representing {@code node}.
     */
    private generateFTANode(node: AstNode, args: GeneratorContext<ModelFTA>): FTANode {
        const idCache = args.idCache;
        if(isTopEvent(node) || isGate(node) || isComponent(node) || isCondition(node)){
            const nodeId = idCache.uniqueId(node.name, node);

            let children: SModelElement[] = [
                <SLabel>{
                    type: 'label',
                    id: idCache.uniqueId(nodeId + '.label'),
                    text: node.name
                }
            ];
            if(isComponent(node) || isCondition(node)){
                return {
                    type: FTA_NODE_TYPE,
                    id: nodeId,
                    aspect: getAspect(node),
                    description: node.description,
                    children: children,
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
                    aspect: getAspect(node),
                    description: "",
                    children: children,
                    layout: 'stack',
                    layoutOptions: {
                        paddingTop: 10.0,
                        paddingBottom: 10.0,
                        paddngLeft: 10.0,
                        paddingRight: 10.0
                    }
                };
            }
        }else {
            throw new Error("generateFTANode method should only be called with an FTA component");
        }
    }
}