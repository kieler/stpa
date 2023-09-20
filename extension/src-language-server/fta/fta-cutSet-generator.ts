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
    determineMinimalCutSet(allNodes: AstNode[], idCache: IdCache<AstNode>): AstNode[][] {
        // TODO: add minimal flag (could reduce computation cost)
        const allCutSets = this.generateCutSetsForFT(allNodes, idCache);

        // Cut sets are minimal if removing one element destroys the cut set
        // If an inner list contains another array from the bdd array, remove it since it is not minimal
        const minimalCutSet = allCutSets.filter((cutSet) => {
            return this.checkIfMinimalCutSet(cutSet, allCutSets);
        });

        return minimalCutSet;
    }

    /**
     * Checks whether the given list {@code innerList} is a minimal cut set.
     * @param cutSet The list to check.
     * @param allCutSets All Cut Sets of the Fault Tree.
     * @returns True if the given list is a minimal cut set.
     */
    protected checkIfMinimalCutSet(cutSet: AstNode[], allCutSets: AstNode[][]): boolean {
        for (const otherCutSet of allCutSets) {
            if (otherCutSet.every((element) => cutSet.includes(element)) && cutSet !== otherCutSet) {
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
    generateCutSetsForFT(allNodes: AstNode[], idCache: IdCache<AstNode>): AstNode[][] {
        /*  Idea:
            Start from the top event.
            Get the only child of top event (will always be only one) as our starting node.
            Calculate all children of the node and evaluate them.
            In the evaluation we check if the child has children too and do the same recursively until 
            the children are components.
            Depending on the type of the node process the results of the children differently. */

        const startNode = this.getChildOfTopEvent(allNodes);
        if (startNode) {
            // When the start not is not a gate, it is the only cut set
            if (isComponent(startNode)) {
                return [[startNode]];
            }
            // determine the cut sets of the Fault Tree
            return this.determineCutSetsForGate(startNode, allNodes, idCache);
        }
        return [];
    }

    /**
     * Determines the cut sets for the (sub) fault tree that has {@code gate} as the top node.
     * @param gate The top node of the (sub) fault tree for which the cut sets should be determined.
     * @param allNodes All nodes of the fault tree.
     * @param idCache The idCache of the generator context from the corresponding graph.
     * @returns the determined cut sets for the (sub) fault tree as a list of lists.
     */
    protected determineCutSetsForGate(gate: AstNode, allNodes: AstNode[], idCache: IdCache<AstNode>): AstNode[][] {
        let result: AstNode[][] = [];

        const children = this.getChildrenOfNode(gate);
        // TODO: return list containing only the gate, when it is not a gate
        if (children.length === 0 || !isGate(gate)) {
            return result;
        }

        if (isAND(gate.type) || isInhibitGate(gate.type)) {
            // concatenate each cut set of a child with every cut set of the other children
            for (const child of children) {
                if (isComponent(child) || isCondition(child)) {
                    result = this.concatInnerListsWithEachOther([[child]], result, idCache);
                } else {
                    result = this.concatInnerListsWithEachOther(
                        this.determineCutSetsForGate(child, allNodes, idCache),
                        result,
                        idCache
                    );
                }
            }
        } else if (isOR(gate.type)) {
            // add the cut sets of each child to the result
            for (const child of children) {
                if (isComponent(child)) {
                    result.push([child]);
                } else {
                    result.push(...this.determineCutSetsForGate(child, allNodes, idCache));
                }
            }
        } else if (isKNGate(gate.type)) {
            // TODO: inspect
            const k = gate.type.k;
            const n = gate.type.children.length;

            // determine every combination of the children with length k or greater
            // Example: children = [M1, M2, G1] and k = 2 -> [[M1, M2], [M1, G1], [M2, G1], [M1, M2, G1]]
            const combinations: AstNode[][] = [];
            for (let i = k; i <= n; i++) {
                combinations.push(...this.createAllCombinations(children, i));
            }

            //Now we want to evaluate G1 from the example above (e.g evaluation(G1) = [[C]]).
            //Our result list should look like this -> [[M1,M2], [M1,C], [M2,C]].
            for (const comb of combinations) {
                if (
                    comb.some(
                        (element) =>
                            isGate(element) &&
                            (isAND(element.type) ||
                                isInhibitGate(element.type) ||
                                isOR(element.type) ||
                                isKNGate(element.type))
                    )
                ) {
                    const evaluatedLists = this.evaluateGateInCombinationList(comb, allNodes, idCache);
                    result.push(...evaluatedLists);
                } else {
                    result.push(comb);
                }
            }
        }

        return result;
    }

    // TODO: inspect
    /**
     * Takes a list of components, conditions and gates and then removes the gates and inserts its evaluation in the list. This can result in multiple lists.
     * @param innerList The list we want to evaluate.
     * @param allNodes All Nodes in the graph.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns A list of lists that is the result of inserting the evaluation of the gates in the given list.
     */
    protected evaluateGateInCombinationList(
        innerList: AstNode[],
        allNodes: AstNode[],
        idCache: IdCache<AstNode>
    ): AstNode[][] {
        let result: AstNode[][] = [];
        const restList: AstNode[] = innerList;

        for (let i = 0; i < restList.length; i++) {
            const element = restList[i];
            // when the element is a gate.
            if (isGate(element)) {
                //cut out the gate from the rest list.
                const index = restList.indexOf(element);
                restList.splice(index, 1);
                i -= 1;
                //and push the evaluation of the gate into the result list.
                const tempLists = this.concatInnerListsWithEachOther(
                    this.determineCutSetsForGate(element, allNodes, idCache),
                    result,
                    idCache
                );
                result = [];
                for (const list of tempLists) {
                    result.push(list);
                }
            }
        }
        //concatenate every element of the rest list with the result (should only be components/conditions).
        for (const list of restList) {
            result = this.concatInnerListsWithEachOther([[list]], result, idCache);
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
            nodes.forEach(node => combinations.push([node]));
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
     * Concatenates every inner List of two two-dimensional arrays with each other. 
     * E.g. [X1, X2] and [Y1, Y2] result in [[X1, Y1], [X1, Y2], [X2, Y1], [X2, Y2]].
     * @param firstAllCutSets The first two-dimensional array.
     * @param secondAllCutSets The second two-dimensional array.
     * @param idCache The idCache of the generator context from the corresponding graph.
     * @returns a two-dimensional array where every innerList of both arrays is concatenated with each other.
     */
    protected concatInnerListsWithEachOther(
        firstAllCutSets: AstNode[][],
        secondAllCutSets: AstNode[][],
        idCache: IdCache<AstNode>
    ): AstNode[][] {
        const result: AstNode[][] = [];
        // if one array is empty, return the other
        if (firstAllCutSets.length === 0) {
            return secondAllCutSets;
        }
        if (secondAllCutSets.length === 0) {
            return firstAllCutSets;
        }
        // concatenate arrays
        // TODO: replace array with set
        for (const firstCutSet of firstAllCutSets) {
            for (const secondCutSet of secondAllCutSets) {
                // add only unique sets
                let newSet = firstCutSet.concat(secondCutSet);
                newSet = newSet.filter((element, index) => newSet.indexOf(element) === index);
                if (this.indexOfArray(newSet, result, idCache) === -1) {
                    result.push(newSet);
                }
            }
        }
        return result;
    }

    // TODO: inspect / needed?
    /**
     * Checks whether two arrays are equal by sorting them and comparing their values.
     * @param first The first array to compare.
     * @param second The second array to compaare.
     * @param idCache The idCache of the generator context from the corresponding graph.
     * @returns True if the arrays are equal and false otherwise.
     */
    protected arrayEquals(first: AstNode[], second: AstNode[], idCache: IdCache<AstNode>): boolean {
        const sort = (x: AstNode, y: AstNode): number => {
            const idX = idCache.getId(x);
            const idY = idCache.getId(y);
            if (idX && idY) {
                return idX > idY ? -1 : 1;
            }
            return 0;
        };
        const sortA = first.sort(sort);
        const sortB = second.sort(sort);
        return first.length === second.length && sortA.every((e, i) => e === sortB[i]);
    }

    // TODO: inspect / needed?
    /**
     * Gets the index of a list if it's contained in a two-dimensional list of AstNodes or -1 otherwise.
     * @param a The list we want the index of.
     * @param b The two-dimensional list of AstNodes we want to search in.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns the index of the list.
     */
    protected indexOfArray(a: AstNode[], b: AstNode[][], idCache: IdCache<AstNode>): number {
        let i = 0;
        for (const list of b) {
            if (this.arrayEquals(a, list, idCache)) {
                break;
            }
            i++;
        }
        if (i >= b.length) {
            return -1;
        }
        return i;
    }
}
