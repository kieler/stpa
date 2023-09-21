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
import { IdCache } from "langium-sprotty";
import {
    TopEvent,
    isAND,
    isComponent,
    isCondition,
    isGate,
    isInhibitGate,
    isKNGate,
    isOR,
    isTopEvent,
} from "../generated/ast";

export class CutSetGenerator {
    /**
     * Takes the Fault Tree and returns a two-dimensional array of AstNodes where every inner list resembles a minimal
     * cut set.
     * @param allNodes All Nodes in the fault tree.
     * @param idCache The idCache of the generator context from the corresponding graph.
     * @returns A list of lists that that contains every minimal cut set of the given Fault Tree.
     */
    determineMinimalCutSet(allNodes: AstNode[], idCache: IdCache<AstNode>): Set<AstNode>[] {
        // TODO: add minimal flag (could reduce computation cost)
        const allCutSets = this.generateCutSetsForFT(allNodes, idCache);

        // Cut sets are minimal if removing one element destroys the cut set
        // If cut set contains another cut set from the array, remove it since it is not minimal
        const minimalCutSet = allCutSets.filter((cutSet) => this.checkIfMinimalCutSet(cutSet, allCutSets));

        return minimalCutSet;
    }

    /**
     * Checks whether the given list {@code innerList} is a minimal cut set.
     * @param cutSet The list to check.
     * @param allCutSets All Cut Sets of the Fault Tree.
     * @returns True if the given list is a minimal cut set.
     */
    protected checkIfMinimalCutSet(cutSet: Set<AstNode>, allCutSets: Set<AstNode>[]): boolean {
        for (const otherCutSet of allCutSets) {
            let contained = true;
            otherCutSet.forEach((element) => {
                if (!cutSet.has(element)) {
                    contained = false;
                }
            });
            if (contained && cutSet !== otherCutSet) {
                return false;
            }
        }
        return true;
    }

    /**
     * Determines all cut sets of a fault tree.
     * @param allNodes All nodes of the fault tree.
     * @param idCache The idCache of the generator context from the corresponding graph.
     * @returns A list of lists that contains every cut set of the given Fault Tree.
     */
    generateCutSetsForFT(allNodes: AstNode[], idCache: IdCache<AstNode>): Set<AstNode>[] {
        /*  Idea:
            Start from the top event.
            Get the only child of top event (will always be only one) as our starting node.
            Calculate all children of the node and evaluate them.
            In the evaluation we check if the child has children too and do the same recursively until 
            the children are components.
            Depending on the type of the node process the results of the children differently. */

        const startNode = this.getChildOfTopEvent(allNodes);
        if (startNode) {
            // determine the cut sets of the Fault Tree
            return this.determineCutSetsForGate(startNode, allNodes, idCache);
        }
        return [];
    }

    /**
     * Determines the cut sets for the (sub) fault tree that has {@code startNode} as the top node.
     * @param startNode The top node of the (sub) fault tree for which the cut sets should be determined.
     * @param allNodes All nodes of the fault tree.
     * @param idCache The idCache of the generator context from the corresponding graph.
     * @returns the determined cut sets for the (sub) fault tree as a list of lists.
     */
    protected determineCutSetsForGate(
        startNode: AstNode,
        allNodes: AstNode[],
        idCache: IdCache<AstNode>
    ): Set<AstNode>[] {
        let result: Set<AstNode>[] = [];

        // components do not have children, so return the component
        if (isComponent(startNode) || isCondition(startNode)) {
            return [new Set<AstNode>([startNode])];
        }

        const children = this.getChildrenOfNode(startNode);
        if (children.length === 0 || !isGate(startNode)) {
            return result;
        }

        if (isAND(startNode.type) || isInhibitGate(startNode.type)) {
            // concatenate each cut set of a child with every cut set of the other children
            for (const child of children) {
                result = this.concatInnerListsWithEachOther(
                    this.determineCutSetsForGate(child, allNodes, idCache),
                    result
                );
            }
        } else if (isOR(startNode.type)) {
            // add the cut sets of each child to the result
            for (const child of children) {
                result.push(...this.determineCutSetsForGate(child, allNodes, idCache));
            }
        } else if (isKNGate(startNode.type)) {
            const k = startNode.type.k;
            const n = startNode.type.children.length;

            // determine every combination (with length k or greater) of the children
            // Example: children = [M1, M2, G1] and k = 2 -> [[M1, M2], [M1, G1], [M2, G1], [M1, M2, G1]]
            const combinations: AstNode[][] = [];
            for (let i = k; i <= n; i++) {
                combinations.push(...this.createAllCombinations(children, i));
            }

            // determine the cut sets for each combination 
            // (treat each combination the same way as an AND gate with the combination as its children)
            for (const combination of combinations) {
                let intermediateResult: Set<AstNode>[] = [];
                for (const element of combination) {
                    intermediateResult = this.concatInnerListsWithEachOther(
                        this.determineCutSetsForGate(element, allNodes, idCache),
                        intermediateResult
                    );
                }
                result.push(...intermediateResult);
            }
        }

        return result;
    }

    /**
     * Create all combinations with length {@code k} of the given {@code nodes}.
     * @param nodes The list of nodes for which all combinations should be created.
     * @param k The number of elements in a combination.
     * @returns all combinations with length {@code k} of the given {@ode ndoes}.
     */
    protected createAllCombinations(nodes: AstNode[], k: number): AstNode[][] {
        const combinations: AstNode[][] = [];

        if (k > nodes.length || k <= 0) {
            return [];
        }
        if (k === nodes.length) {
            return [nodes];
        }
        if (k === 1) {
            nodes.forEach((node) => combinations.push([node]));
        }

        for (let i = 0; i < nodes.length; i++) {
            const currentNode: AstNode = nodes[i];
            for (const subElements of this.createAllCombinations(nodes.slice(i + 1), k - 1)) {
                subElements.unshift(currentNode);
                combinations.push(subElements);
            }
        }

        return combinations;
    }

    /**
     * Determines all the children of {@code node}.
     * @param node The node for which the children should be determined.
     * @returns all children of the given {@code node}.
     */
    protected getChildrenOfNode(node: AstNode): AstNode[] {
        const children: AstNode[] = [];
        if (isComponent(node) || isCondition(node)) {
            // node has no children
            return children;
        }

        if (isGate(node)) {
            // add children of the gate
            for (const childRef of node.type.children) {
                if (childRef.ref) {
                    children.push(childRef.ref);
                }
            }
            // add condition of inhibit gate
            if (isInhibitGate(node.type)) {
                for (const childRef of node.type.condition) {
                    if (childRef?.ref) {
                        children.push(childRef.ref);
                    }
                }
            }
        }
        return children;
    }

    /**
     * Determines the child of the top event.
     * @param allNodes All nodes in the fault tree.
     * @returns the child of the top event.
     */
    protected getChildOfTopEvent(allNodes: AstNode[]): AstNode | undefined {
        const topEventChildren = (allNodes.find((node) => isTopEvent(node)) as TopEvent).children;
        if (topEventChildren.length !== 0) {
            return topEventChildren[0].ref;
        }
    }

    /**
     * Concatenates the cut sets of two sets with each other.
     * E.g. [X1, X2] and [Y1, Y2] result in [[X1, Y1], [X1, Y2], [X2, Y1], [X2, Y2]].
     * @param firstAllCutSets The first set of cut sets.
     * @param secondAllCutSets The second set of cut sets.
     * @returns a set where every cut set of both sets is concatenated with each other.
     */
    protected concatInnerListsWithEachOther(
        firstAllCutSets: Set<AstNode>[],
        secondAllCutSets: Set<AstNode>[]
    ): Set<AstNode>[] {
        const result: Set<AstNode>[] = [];
        // if one cut set set is empty, return the other
        if (firstAllCutSets.length === 0) {
            return secondAllCutSets;
        }
        if (secondAllCutSets.length === 0) {
            return firstAllCutSets;
        }
        // concatenate sets
        for (const firstCutSet of firstAllCutSets) {
            for (const secondCutSet of secondAllCutSets) {
                // add the new set if it snot already included in the result
                const newSet = new Set([...firstCutSet, ...secondCutSet]);
                if (result.every((cutSet) => !eqSet(cutSet, newSet))) {
                    result.push(newSet);
                }
            }
        }
        return result;
    }
}

/** Checks whether two sets of AstNodes are equal */
const eqSet = (xs: Set<AstNode>, ys: Set<AstNode>): boolean => xs.size === ys.size && [...xs].every((x) => ys.has(x));
