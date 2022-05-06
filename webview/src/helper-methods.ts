import { SNode, SEdge } from "sprotty"
import { STPAAspect, STPANode, STPA_NODE_TYPE } from "./STPA-model"

/**
 * Collects all children of the nodes in {@code nodes}.
 * @param nodes The nodes, which children should be selected.
 * @param children List that is filled by this method with the childrens of {@code nodes}.
 */
export function collectAllChildren(nodes: SNode[], children: SNode[]): void {
    for (const node of nodes) {
        if (node.children.length != 0) {
            const childrenNodes = node.children.filter(child => child instanceof SNode) as SNode[]
            children.push(...childrenNodes)
            collectAllChildren(childrenNodes, children)
        }
    }
}

/**
 * Searches the selected node.
 * @param nodes All nodes of a graph.
 * @returns The selected node or undefined if no node of the {@code nodes} is selected.
 */
 export function getSelectedNode(nodes: SNode[]): SNode | undefined {
    for (const node of nodes) {
        if (node.selected) {
            return node
        }
    }
    return undefined
}

/**
 * Collectes the nodes connected to {@code node}
 * @param node The node for which the connected nodes should be determined.
 * @returns The nodes connected to {@code node}
 */
export function getConnectedNodes(node: SNode): Set<SNode> {
    const conNodes: Set<SNode> = new Set([node])
    if (isSubConstraint(node)) {
        addSubConsParent(conNodes, node)
    }
    if (isSubHazard(node)) {
        conNodes.add(node.parent as STPANode)
        for (const outEdge of (node.parent as STPANode).outgoingEdges) {
            collectSuccNodes(conNodes, outEdge)
        }
    }
    for (const edge of node.incomingEdges) {
        collectPredNodes(conNodes, edge)
    }
    for (const edge of node.outgoingEdges) {
        collectSuccNodes(conNodes, edge)
    }
    return conNodes
}

/**
 * Collect the predecessor nodes based on the {@code edge}.
 * @param nodes Set to which the predecessor nodes should be added.
 * @param edge The edge which source and further predecessors should be inspected.
 */
function collectPredNodes(nodes: Set<SNode>, edge: SEdge): void {
    const node = edge.source as SNode
    nodes.add(node)
    if (isSubConstraint(node)) {
        addSubConsParent(nodes, node)
    }
    if (node.type == STPA_NODE_TYPE && (node as STPANode).aspect == STPAAspect.HAZARD) {
        const subHazards = node.children.filter(child => child.type == STPA_NODE_TYPE) as STPANode[]
        for (const subH of subHazards) {
            nodes.add(subH)
            for (const inEdge of subH.incomingEdges) {
                collectPredNodes(nodes, inEdge)
            }
        }
    }
    for (const inEdge of node.incomingEdges) {
        collectPredNodes(nodes, inEdge)
    }
}

/**
 * Collect the successor nodes based on the {@code edge}.
 * @param nodes Set to which the successor nodes should be added.
 * @param edge The edge which target and further successors should be inspected.
 */
function collectSuccNodes(nodes: Set<SNode>, edge: SEdge): void {
    const node = edge.target as SNode
    nodes.add(node)
    if (isSubConstraint(node)) {
        addSubConsParent(nodes, node)
    }
    if (isSubHazard(node)) {
        nodes.add(node.parent as STPANode)
        for (const outEdge of (node.parent as STPANode).outgoingEdges) {
            collectSuccNodes(nodes, outEdge)
        }
    }
    for (const outEdge of node.outgoingEdges) {
        collectSuccNodes(nodes, outEdge)
    }
}

/**
 * Determines if {@code node} is a sub-hazard.
 * @param node The SNode that should be inspected.
 * @returns whether {@code node} is a sub-hazard.
 */
function isSubHazard(node: SNode): boolean {
    return node.type == STPA_NODE_TYPE && (node as STPANode).aspect == STPAAspect.HAZARD 
        && node.parent.type == STPA_NODE_TYPE && (node.parent as STPANode).aspect == STPAAspect.HAZARD
}

/**
 * Determines if {@code node} is a sub-constraint.
 * @param node The SNode that should be inspected.
 * @returns whether {@code node} is a sub-constraint.
 */
 function isSubConstraint(node: SNode): boolean {
    return node.type == STPA_NODE_TYPE && (node as STPANode).aspect == STPAAspect.SYSTEMCONSTRAINT 
        && node.parent.type == STPA_NODE_TYPE && (node.parent as STPANode).aspect == STPAAspect.SYSTEMCONSTRAINT
}

/**
 * Adds the parents of the system constraint {@code node} to {@code nodes}.
 * @param nodes The set the parents should be added to.
 * @param node The node, which parents should be added.
 */
function addSubConsParent(nodes: Set<SNode>, node: SNode): void {
    let parent = node
    while (parent.parent.type == STPA_NODE_TYPE && (parent.parent as STPANode).aspect == STPAAspect.SYSTEMCONSTRAINT) {
        parent = parent.parent as STPANode
        nodes.add(parent)
    }
}