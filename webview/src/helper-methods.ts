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

import { SNode, SEdge } from "sprotty"
import { STPAAspect, STPAEdge, STPANode, STPA_NODE_TYPE } from "./STPA-model"

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
 * Sets the connected attribute of the nodes and egde connected to {@code node}.
 * @param node The node for which the connected elements should be determined.
 */
export function flagConnectedElements(node: SNode): void {
    (node as STPANode).connected = true
    if (isSubConstraint(node)) {
        flagSubConsParent(node as STPANode)
    }
    if (isSubHazard(node)) {
        (node.parent as STPANode).connected = true
        for (const outEdge of (node.parent as STPANode).outgoingEdges) {
            (outEdge as STPAEdge).connected = true
            flagSuccNodes(outEdge)
        }
    }
    for (const edge of node.incomingEdges) {
        (edge as STPAEdge).connected = true
        flagPredNodes(edge)
    }
    for (const edge of node.outgoingEdges) {
        (edge as STPAEdge).connected = true
        flagSuccNodes(edge)
    }
}

/**
 * Sets the connected attribute of the predecessor nodes and edges based on the {@code edge}.
 * @param edge The edge which source and further predecessors should be inspected.
 */
function flagPredNodes(edge: SEdge): void {
    const node = edge.source as SNode
    (node as STPANode).connected = true
    if (isSubConstraint(node)) {
        flagSubConsParent(node as STPANode)
    }
    if (node.type == STPA_NODE_TYPE && (node as STPANode).aspect == STPAAspect.HAZARD) {
        const subHazards = node.children.filter(child => child.type == STPA_NODE_TYPE) as STPANode[]
        for (const subH of subHazards) {
            subH.connected = true
            for (const inEdge of subH.incomingEdges) {
                (inEdge as STPAEdge).connected = true
                flagPredNodes(inEdge)
            }
        }
    }
    for (const inEdge of node.incomingEdges) {
        (inEdge as STPAEdge).connected = true
        flagPredNodes(inEdge)
    }
}

/**
 * Sets the connected attribute of the successor nodes and edges based on the {@code edge}.
 * @param edge The edge which target and further successors should be inspected.
 */
function flagSuccNodes(edge: SEdge): void {
    const node = edge.target as SNode
    (node as STPANode).connected = true
    if (isSubConstraint(node)) {
        flagSubConsParent(node as STPANode)
    }
    if (isSubHazard(node)) {
        (node.parent as STPANode).connected = true
        for (const outEdge of (node.parent as STPANode).outgoingEdges) {
            (outEdge as STPAEdge).connected = true
            flagSuccNodes(outEdge)
        }
    }
    for (const outEdge of node.outgoingEdges) {
        (outEdge as STPAEdge).connected = true
        flagSuccNodes(outEdge)
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
 * Sets the connected attribute of the parents of the system constraint {@code node}.
 * @param node The node, which parents should be added.
 */
function flagSubConsParent(node: STPANode): void {
    let parent = node
    while (parent.parent.type == STPA_NODE_TYPE && (parent.parent as STPANode).aspect == STPAAspect.SYSTEMCONSTRAINT) {
        parent = parent.parent as STPANode
        parent.connected = true
    }
}