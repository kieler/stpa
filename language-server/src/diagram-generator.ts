import { AstNode } from 'langium';
import { GeneratorContext, LangiumDiagramGenerator } from 'langium-sprotty'
import { SModelRoot, SLabel, SEdge, SModelElement } from 'sprotty-protocol';
import { isContConstraint, isHazard, isLoss, isLossScenario, isResponsibility, isSafetyConstraint, 
    isSystemConstraint, isUCA, Model, Node } from './generated/ast';
import { Options } from './options';
import { CSEdge, CSNode, STPANode } from './STPA-interfaces';
import { PARENT_TYPE, EdgeDirection, CS_EDGE_TYPE, CS_NODE_TYPE, STPA_NODE_TYPE } from './STPA-model'
import { StpaServices } from './stpa-module';
import { getAspect, getTargets } from './utils';


export class STPADiagramGenerator extends LangiumDiagramGenerator {

    protected readonly options: Options

    constructor(services: StpaServices) {
        super(services);
        this.options = services.options.Options
    }

    protected generateRoot(args: GeneratorContext<Model>): SModelRoot {
        const { document } = args;
        const model: Model = document.parseResult.value;

        let stpaChildren = [
            ...model.losses?.map(l => this.generateSTPANode(l, args)),
            ...model.hazards?.map(h => this.generateAspectWithEdges(h, args)).flat(1),
            ...model.systemLevelConstraints?.map(sc => this.generateAspectWithEdges(sc, args)).flat(1),
        ]
        if (!this.options.getHierarchy()) {
            stpaChildren = stpaChildren.concat([
                    ...model.hazards?.map(h => h.subComps?.map(sh => this.generateAspectWithEdges(sh, args))).flat(2),
                    ...model.systemLevelConstraints?.map(sc => sc.subComps?.map(ssc => this.generateAspectWithEdges(ssc, args))).flat(2)
                ])
        } else {
            stpaChildren = stpaChildren.concat(model.systemLevelConstraints?.map(sc => sc.subComps?.map(ssc => this.generateEdgesForSTPANode(ssc, args))).flat(2))
        }
        stpaChildren = stpaChildren.concat([
            ...model.responsibilities?.map(r => r.responsiblitiesForOneSystem.map(resp => this.generateAspectWithEdges(resp, args))).flat(2),
            ...model.allUCAs?.map(allUCA => allUCA.ucas.map(uca => this.generateAspectWithEdges(uca, args))).flat(2),
            ...model.controllerConstraints?.map(c => this.generateAspectWithEdges(c, args)).flat(1),
            ...model.scenarios?.map(s => this.generateAspectWithEdges(s, args)).flat(1),
            ...model.safetyCons?.map(sr => this.generateAspectWithEdges(sr, args)).flat(1)
        ])
        if (model.controlStructure) {
            const CSChildren= [
                ...model.controlStructure?.nodes.map(n => this.generateCSNode(n, args)),
                ...this.generateVerticalCSEdges(model.controlStructure.nodes, args),
                //...this.generateHorizontalCSEdges(model.controlStructure.edges, args)
            ] 
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
            }
        } else {
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
            }
        }
    }
    
    protected generateVerticalCSEdges(nodes: Node[], args: GeneratorContext<Model>): CSEdge[]{
        const idCache = args.idCache
        let edges: CSEdge[] = []
        for (const node of nodes) {
            for (const edge of node.actions) {
                const sourceId = idCache.getId(edge.$container)
                const targetId = idCache.getId(edge.target.ref)
                const edgeId = idCache.uniqueId(`${sourceId}:${edge.comms[0].name}:${targetId}`, edge)
                let label = ''
                for (let i = 0; i < edge.comms.length; i++) {
                    const com = edge.comms[i]
                    label+=com.label
                    if (i < edge.comms.length - 1) {
                        label += ", "
                    }
                }
                const e = this.generateCSEdge(edgeId, sourceId ? sourceId : '', targetId ? targetId : '', 
                                label, EdgeDirection.DOWN, args)
                edges.push(e)
            }
            for (const edge of node.feedbacks) {
                const sourceId = idCache.getId(edge.$container)
                const targetId = idCache.getId(edge.target.ref)
                const edgeId = idCache.uniqueId(`${sourceId}:${edge.comms[0].name}:${targetId}`, edge)
                let label = ''
                for (let i = 0; i < edge.comms.length; i++) {
                    const com = edge.comms[i]
                    label+=com.label
                    if (i < edge.comms.length - 1) {
                        label += ", "
                    }
                }
                const e = this.generateCSEdge(edgeId, sourceId ? sourceId : '', targetId ? targetId : '', 
                                label, EdgeDirection.UP, args)
                edges.push(e)
            }
        }
        return edges
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

    protected generateCSNode(node: Node, { idCache }: GeneratorContext<Model>): CSNode {
        const label = node.label ? node.label : node.name
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
        }
    }

    protected generateAspectWithEdges(node: AstNode, args: GeneratorContext<Model>): SModelElement[] {
        // node must be created first in order to access the id when creating the edges
        const stpaNode = this.generateSTPANode(node, args)
        const elements: SModelElement[] = this.generateEdgesForSTPANode(node, args)
        elements.push(stpaNode)
        return elements
    }

    protected generateEdgesForSTPANode(node: AstNode, args: GeneratorContext<Model>): SModelElement[] {
        const idCache = args.idCache
        const elements: SModelElement[] = []

        const sourceId = idCache.getId(node)
        const targets = getTargets(node, this.options.getHierarchy())
        for (const target of targets) {
            let targetId = idCache.getId(target)
            const edgeId = idCache.uniqueId(`${sourceId}:-:${targetId}`, undefined)
            if (sourceId && targetId) {
                const e = this.generateSEdge(edgeId, sourceId, targetId, '', args)
                elements.push(e)
            }
        }
        return elements
    }

    protected generateSTPANode(node: AstNode, args: GeneratorContext<Model>): STPANode {
        const idCache = args.idCache
        if (isLoss(node)|| isHazard(node) || isSystemConstraint(node) || isContConstraint(node) || isLossScenario(node) 
                    || isSafetyConstraint(node) || isResponsibility(node) || isUCA(node)){
            const nodeId = idCache.uniqueId(node.name, node);
            const subcomp = isHazard(node.$container) || isSystemConstraint(node.$container)
            let children: SModelElement[] = [
                <SLabel>{
                    type: 'label',
                    id: idCache.uniqueId(nodeId + '.label'),
                    text: node.name
                }
            ]
            if (this.options.getHierarchy() && (isHazard(node) && node.subComps.length != 0)) {
                children = children.concat(node.subComps?.map((sc: AstNode) => this.generateSTPANode(sc, args)))
            }
            if (this.options.getHierarchy() && isSystemConstraint(node) && node.subComps.length != 0) {
                children = children.concat(node.subComps?.map((sc: AstNode) => this.generateSTPANode(sc, args)))
            }
            return {
                type: STPA_NODE_TYPE,
                id: nodeId,
                aspect: getAspect(node),
                description: node.description,
                subcomp: subcomp,
                children: children,
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