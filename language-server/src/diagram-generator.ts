import { AstNode } from 'langium';
import { GeneratorContext, LangiumDiagramGenerator } from 'langium-sprotty'
import { SModelRoot, SLabel, SEdge, SModelElement } from 'sprotty-protocol';
import { Edge, isContConstraint, isHazard, isLoss, isLossScenario, isResponsibility, isSafetyConstraint, 
    isSystemConstraint, isUCA, Model, Node } from './generated/ast';
import { CSEdge, CSNode, CS_EDGE_TYPE, CS_NODE_TYPE, EdgeDirection, PARENT_TYPE, STPANode, STPA_NODE_TYPE } from './STPA-model';
import { getAspect, getTargets } from './utils';

export class STPADiagramGenerator extends LangiumDiagramGenerator {

    protected generateRoot(args: GeneratorContext<Model>): SModelRoot {
        const { document } = args;
        const model: Model = document.parseResult.value;
        console.log("TEST")
        const CSChildren= [
            ...model.controlStructure.nodes.map(n => this.generateNode(n, args)),
            ...this.generateVerticalCSEdges(model.controlStructure.nodes, args),
            ...this.generateHorizontalCSEdges(model.controlStructure.edges, args)
        ] 
        /* const nodes = []
        for (const n of CSChildren) {
            if (n instanceof CSNode) nodes.push(n)
        }
        determineLayerForCSNodes(nodes) */
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
                    children: [
                        ...model.losses.map(l => this.generateSTPANode(l, args)),
                        ...model.hazards.map(h => this.generateAspectWithEdges(h, args)).flat(1),
                        ...model.systemLevelConstraints.map(sc => this.generateAspectWithEdges(sc, args)).flat(1),
                        ...model.responsibilities.map(r => r.responsiblitiesForOneSystem.map(resp => this.generateAspectWithEdges(resp, args))).flat(2),
                        ...model.allUCAs.map(allUCA => allUCA.ucas.map(uca => this.generateAspectWithEdges(uca, args))).flat(2),
                        ...model.controllerConstraints.map(c => this.generateAspectWithEdges(c, args)).flat(1),
                        ...model.scenarios.map(s => this.generateAspectWithEdges(s, args)).flat(1),
                        ...model.safetyCons.map(sr => this.generateAspectWithEdges(sr, args)).flat(1)
                    ]
                }
            ]
        }
    }
    
    protected generateVerticalCSEdges(nodes: Node[], args: GeneratorContext<Model>): CSEdge[]{
        const idCache = args.idCache
        let edges: CSEdge[] = []
        for (const node of nodes) {
            for (const edge of node.actions) {
                const sourceId = idCache.getId(edge.$container)
                const targetId = idCache.getId(edge.target.ref)
                const edgeId = idCache.uniqueId(`${sourceId}:${edge.name}:${targetId}`, edge)
                const e = this.generateCSEdge(edgeId, sourceId ? sourceId : '', targetId ? targetId : '', 
                                edge.label? edge.label:edge.name, EdgeDirection.DOWN, args)
                edges.push(e)
            }
            for (const edge of node.feedbacks) {
                const sourceId = idCache.getId(edge.$container)
                const targetId = idCache.getId(edge.target.ref)
                const edgeId = idCache.uniqueId(`${sourceId}:${edge.name}:${targetId}`, edge)
                const e = this.generateCSEdge(edgeId, sourceId ? sourceId : '', targetId ? targetId : '', 
                                edge.label? edge.label:edge.name, EdgeDirection.UP, args)
                edges.push(e)
            }
        }
        return edges
    }

    protected generateHorizontalCSEdges(edges: Edge[], args: GeneratorContext<Model>): SEdge[]{
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
    }

    private generateCSEdge(edgeId: string, sourceId: string, targetId: string, label:string, direction: EdgeDirection, { idCache }: GeneratorContext<Model>): CSEdge {
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
        }
    }

    private generateSEdge(edgeId: string, sourceId: string, targetId: string, label:string, { idCache }: GeneratorContext<Model>): SEdge {
        if (label != '') {
            return {
                type: 'edge',
                id: edgeId,
                sourceId: sourceId,
                targetId: targetId,
                children: [
                    <SLabel> {
                        type: 'label:xref',
                        id: idCache.uniqueId(edgeId + '.label'),
                        text: label
                    }
                ]
            }
        } else {
            return {
                type: 'edge',
                id: edgeId,
                sourceId: sourceId,
                targetId: targetId,
            }
        }
    }

    protected generateNode(node: Node, { idCache }: GeneratorContext<Model>): CSNode {
        const label = node.label ? node.label : node.name
        const nodeId = idCache.uniqueId(node.name, node);
        return {
            type: CS_NODE_TYPE,
            id: nodeId,
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
        }
    }

    protected generateAspectWithEdges(node: AstNode, args: GeneratorContext<Model>): SModelElement[] {
        const idCache = args.idCache
        const elements: SModelElement[] = []
        elements.push(this.generateSTPANode(node, args))

        const sourceId = idCache.getId(node)
        const targets = getTargets(node)
        for (const target of targets) {
            const targetId = idCache.getId(target)
            const edgeId = idCache.uniqueId(`${sourceId}:-:${targetId}`, undefined)
            if (sourceId && targetId) {
                const e = this.generateSEdge(edgeId, sourceId, targetId, '', args)
                elements.push(e)
            }
        }
        return elements
    }

    protected generateSTPANode(node: AstNode, { idCache }: GeneratorContext<Model>): STPANode {
        if (isLoss(node)|| isHazard(node) || isSystemConstraint(node) || isContConstraint(node) || isLossScenario(node) 
                    || isSafetyConstraint(node) || isResponsibility(node) || isUCA(node)){
            const nodeId = idCache.uniqueId(node.name, node);
            return {
                type: STPA_NODE_TYPE,
                id: nodeId,
                aspect: getAspect(node),
                description: node.description,
                children: [
                    <SLabel>{
                        type: 'label',
                        id: idCache.uniqueId(nodeId + '.label'),
                        text: node.name
                    },
                    /* <SPort>{
                        type: 'port',
                        id: idCache.uniqueId(nodeId + '.newTransition'),
                        text: 'test'
                    } */
                ],
                layout: 'stack',
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddngLeft: 10.0,
                    paddingRight: 10.0
                }
            }
        } else {
            throw new Error("generateSTPANode method should only be called with an STPA aspect");
        }
    }

}