import { AstNode } from 'langium';
import { GeneratorContext, LangiumDiagramGenerator } from 'langium-sprotty';
import { SLabel, SModelElement, SModelRoot } from 'sprotty-protocol';
import { ModelFTA, isComponent, isCondition, isGate, isTopEvent } from '../generated/ast';
import { FTAEdge, FTANode } from './fta-interfaces';
import { FTA_EDGE_TYPE, FTA_NODE_TYPE, PARENT_TYPE } from './fta-model';
import { FtaServices } from './fta-module';
import { getAllGateTypes, getAspect, getTargets, setLevelsForFTANodes } from './fta-utils';


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


        let ftaChildren: SModelElement[] = filteredModelFTA.components?.map(l => this.generateFTANode(l, args));

        //returns an array of arrays with with every and,or,kn,inhibit-gate at position 1 to 4.
        const allGates = getAllGateTypes(filteredModelFTA.gates);

        ftaChildren = ftaChildren.concat([
            //first create the ftaNode for the topevent, conditions and all gates
            this.generateFTANode(filteredModelFTA.topEvent, args),
            ...filteredModelFTA.conditions?.map(c => this.generateFTANode(c,args)).flat(1),

            ...allGates[0]?.map(a => this.generateFTANode(a, args)).flat(1),    //and
            ...allGates[1]?.map(o => this.generateFTANode(o, args)).flat(1),    //or
            ...allGates[2]?.map(k => this.generateFTANode(k, args)).flat(1),    //kn
            ...allGates[3]?.map(i => this.generateFTANode(i, args)).flat(1),    //inhib

            //after that create the edges of the gates and the top event
            ...allGates[0]?.map(a => this.generateAspectWithEdges(a, args)).flat(1),
            ...allGates[1]?.map(o => this.generateAspectWithEdges(o, args)).flat(1),
            ...allGates[2]?.map(k => this.generateAspectWithEdges(k, args)).flat(1),
            ...allGates[3]?.map(i => this.generateAspectWithEdges(i, args)).flat(1),
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
        const elements: SModelElement[] = this.generateEdgesForFTANode(node, args);
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
            const targetId = idCache.getId(target);             // g3: - undefined 
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