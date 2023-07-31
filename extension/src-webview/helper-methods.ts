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

import { SNode, SEdge, SModelElement } from "sprotty";
import { PortSide, STPAAspect, STPAEdge, STPANode, STPAPort, STPA_EDGE_TYPE, STPA_INTERMEDIATE_EDGE_TYPE, STPA_NODE_TYPE, STPA_PORT_TYPE } from "./stpa-model";

/**
 * Collects all children of the nodes in {@code nodes}.
 * @param nodes The nodes, which children should be selected.
 * @param children List that is filled by this method with the childrens of {@code nodes}.
 */
export function collectAllChildren(nodes: SNode[], children: SNode[]): void {
    for (const node of nodes) {
        if (node.children.length !== 0) {
            const childrenNodes = node.children.filter(child => child.type.startsWith('node')) as SNode[];
            children.push(...childrenNodes);
            collectAllChildren(childrenNodes, children);
        }
    }
}

/**
 * Sets the highlight attribute of the nodes and egde connected to {@code node}.
 * @param node The node for which the connected elements should be determined.
 * @returns The highlighted nodes.
 */
export function flagConnectedElements(node: SNode): (STPANode | STPAEdge)[] {
    const elements: (STPANode | STPAEdge)[] = [];
    (node as STPANode).highlight = true;
    elements.push(node as STPANode);
    if (isSubConstraint(node)) {
        flagSubConsParent(node as STPANode, elements);
    }
    if (isSubHazard(node)) {
        (node.parent as STPANode).highlight = true;
        elements.push(node.parent as STPANode);

        // flag outgoing edges from parent
        for (const port of node.parent.children.filter(child => child.type === STPA_PORT_TYPE && (child as STPAPort).side === PortSide.NORTH)) {
            for (const child of (node.parent as STPANode).parent.children) {
                if (child.type.startsWith('edge:stpa')) {
                    flagOutgoingEdges(child as STPAEdge, port as STPAPort, elements);
                }
            }
        }
    }
    for (const port of node.children.filter(child => child.type === STPA_PORT_TYPE)) {
        for (const child of node.parent.children) {
            if (child.type === STPA_INTERMEDIATE_EDGE_TYPE) {
                flagOutgoingEdges(child as STPAEdge, port as STPAPort, elements);
            } else if (child.type === STPA_EDGE_TYPE) {
                flagIncomingEdges(child as STPAEdge, port as STPAPort, elements);
                flagOutgoingEdges(child as STPAEdge, port as STPAPort, elements);
            }
        }
    }
    return elements;
}

/**
 * Sets the highlight attribute of the predecessor nodes and edges based on the {@code edge}.
 * @param edge The edge which source and further predecessors should be inspected.
 */
function flagPredNodes(edge: SEdge, elements: SModelElement[]): void {
    const node = edge.source?.type.startsWith('port') ? edge.source.parent as SNode : edge.source as SNode;
    (node as STPANode).highlight = true;
    elements.push(node as STPANode);
    if (isSubConstraint(node)) {
        flagSubConsParent(node as STPANode, elements);
    }
    if (node.type === STPA_NODE_TYPE && (node as STPANode).aspect === STPAAspect.HAZARD) {
        const subHazards = node.children.filter(child => child.type === STPA_NODE_TYPE) as STPANode[];
        for (const subH of subHazards) {
            subH.highlight = true;
            elements.push(subH);
            for (const port of subH.children.filter(child => child.type === STPA_PORT_TYPE && (child as STPAPort).side === PortSide.SOUTH)) {
                for (const child of subH.parent.children) {
                    if (child.type.startsWith('edge:stpa')) {
                        flagIncomingEdges(child as STPAEdge, port as STPAPort, elements);
                    }
                }
            }
        }
    }
    for (const port of node.children.filter(child => child.type === STPA_PORT_TYPE && (child as STPAPort).side === PortSide.SOUTH)) {
        for (const child of node.parent.children) {
            if (child.type.startsWith('edge:stpa')) {
                flagIncomingEdges(child as STPAEdge, port as STPAPort, elements);
            }
        }
    }
}

/**
 * Sets the highlight attribute of the successor nodes and edges based on the {@code edge}.
 * @param edge The edge which target and further successors should be inspected.
 */
function flagSuccNodes(edge: SEdge, elements: SModelElement[]): void {
    const node = edge.target?.type.startsWith('port') ? edge.target.parent as SNode : edge.target as SNode;
    (node as STPANode).highlight = true;
    elements.push(node as STPANode);
    if (isSubConstraint(node)) {
        flagSubConsParent(node as STPANode, elements);
    }
    if (isSubHazard(node)) {
        (node.parent as STPANode).highlight = true;
        elements.push(node.parent as STPANode);
        // for (const outEdge of (node.parent as STPANode).outgoingEdges) {
        //     (outEdge as STPAEdge).highlight = true;
        //     elements.push(outEdge);
        //     flagSuccNodes(outEdge, elements);
        // }
        for (const port of (node.parent as STPANode).children.filter(child => child.type === STPA_PORT_TYPE && (child as STPAPort).side === PortSide.NORTH)) {
            for (const child of (node.parent as STPANode).parent.children) {
                if (child.type.startsWith('edge:stpa')) {
                    flagOutgoingEdges(child as STPAEdge, port as STPAPort, elements);
                }
            }
        }


    }
    for (const port of node.children.filter(child => child.type === STPA_PORT_TYPE && (child as STPAPort).side === PortSide.NORTH)) {
        for (const child of node.parent.children) {
            if (child.type.startsWith('edge:stpa')) {
                flagOutgoingEdges(child as STPAEdge, port as STPAPort, elements);
            }
        }
    }
}

function flagIncomingEdges(edge: STPAEdge, port: STPAPort, elements: SModelElement[]): void {
    if (edge.targetId === port.id) {
        // flag predecessors
        edge.highlight = true;
        elements.push(edge);
        let furtherEdge = (edge.parent as STPANode).parent.children.find(child => child.type.startsWith('edge:stpa') && (child as STPAEdge).targetId === edge.sourceId) as STPAEdge;
        while (furtherEdge) {
            edge = furtherEdge;
            edge.highlight = true;
            elements.push(edge);
            furtherEdge = (edge.parent as STPANode).parent.children.find(child => child.type.startsWith('edge:stpa') && (child as STPAEdge).targetId === edge.sourceId) as STPAEdge;
        }
        flagPredNodes(edge, elements);
    }
}

function flagOutgoingEdges(edge: STPAEdge, port: STPAPort, elements: SModelElement[]): void {
    if (edge.sourceId === port.id) {
        // flag successors
        edge.highlight = true;
        elements.push(edge);
        let furtherEdge = edge.target?.parent.children.find(child => child.type.startsWith('edge:stpa') && (child as STPAEdge).sourceId === edge.targetId) as STPAEdge;
        while (furtherEdge) {
            edge = furtherEdge;
            edge.highlight = true;
            elements.push(edge);
            furtherEdge = edge.target?.parent.children.find(child => child.type.startsWith('edge:stpa') && (child as STPAEdge).sourceId === edge.targetId) as STPAEdge;
        }
        flagSuccNodes(edge, elements);
    }
}

/**
 * Determines if {@code node} is a sub-hazard.
 * @param node The SNode that should be inspected.
 * @returns whether {@code node} is a sub-hazard.
 */
function isSubHazard(node: SNode): boolean {
    return node.type === STPA_NODE_TYPE && (node as STPANode).aspect === STPAAspect.HAZARD
        && node.parent.type === STPA_NODE_TYPE && (node.parent as STPANode).aspect === STPAAspect.HAZARD;
}

/**
 * Determines if {@code node} is a sub-constraint.
 * @param node The SNode that should be inspected.
 * @returns whether {@code node} is a sub-constraint.
 */
function isSubConstraint(node: SNode): boolean {
    return node.type === STPA_NODE_TYPE && (node as STPANode).aspect === STPAAspect.SYSTEMCONSTRAINT
        && node.parent.type === STPA_NODE_TYPE && (node.parent as STPANode).aspect === STPAAspect.SYSTEMCONSTRAINT;
}

/**
 * Sets the highlight attribute of the parents of the system constraint {@code node}.
 * @param node The node, which parents should be added.
 */
function flagSubConsParent(node: STPANode, elements: SModelElement[]): void {
    let parent = node;
    while (parent.parent.type === STPA_NODE_TYPE && (parent.parent as STPANode).aspect === STPAAspect.SYSTEMCONSTRAINT) {
        parent = parent.parent as STPANode;
        parent.highlight = true;
        elements.push(parent);
    }
}

/**
 * Sets the highlight attribute of all nodes that have the same aspect as {@code selected} and are at the same hierarchy level.
 * @param selected The node that determines the aspect that should be highlighted.
 * @returns The highlighted ndoes.
 */
export function flagSameAspect(selected: STPANode): STPANode[] {
    const elements: STPANode[] = [];
    const allNodes: STPANode[] = [];
    collectAllChildren((selected.parent as SNode).parent.children as SNode[], allNodes);
    allNodes.forEach(node => {
        if (node.aspect === selected.aspect) {
            elements.push(node);
            node.highlight = true;
        }
    });
    // if the selected node is a sub-hazard or -sysconstraint, the parent should be highlighted too
    if (selected.parent.type === STPA_NODE_TYPE && ((selected.parent as STPANode).aspect === STPAAspect.HAZARD || (selected.parent as STPANode).aspect === STPAAspect.SYSTEMCONSTRAINT)) {
        elements.push(selected.parent as STPANode);
        (selected.parent as STPANode).highlight = true;
    }
    return elements;
}