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
    Gate,
    isAND,
    isComponent,
    isCondition,
    isGate,
    isInhibitGate,
    isKNGate,
    isOR,
    isTopEvent,
} from "../generated/ast";
import { FTNodeType } from "./fta-model";

/**
 * Getter for the references contained in {@code node}.
 * @param node The AstNode we want the children of.
 * @returns The objects {@code node} is traceable to.
 */
export function getTargets(node: AstNode): AstNode[] {
    const targets: AstNode[] = [];
    if (isTopEvent(node)) {
        for (const ref of node.children) {
            if (ref?.ref) {
                targets.push(ref.ref);
            }
        }
    } else if (isGate(node)) {
        for (const ref of node.type.children) {
            if (ref?.ref) {
                targets.push(ref.ref);
            }
        }
        if (isInhibitGate(node.type)) {
            for (const ref of node.type.condition) {
                if (ref?.ref) {
                    targets.push(ref.ref);
                }
            }
        }
    }
    return targets;
}

/**
 * Getter for the type of a FTA component.
 * @param node AstNode which type should be determined.
 * @returns the type of {@code node}.
 */
export function getFTNodeType(node: AstNode): FTNodeType {
    if (isTopEvent(node)) {
        return FTNodeType.TOPEVENT;
    } else if (isComponent(node)) {
        return FTNodeType.COMPONENT;
    } else if (isCondition(node)) {
        return FTNodeType.CONDITION;
    } else if (isGate(node) && isAND(node.type)) {
        return FTNodeType.AND;
    } else if (isGate(node) && isOR(node.type)) {
        return FTNodeType.OR;
    } else if (isGate(node) && isKNGate(node.type)) {
        return FTNodeType.KN;
    } else if (isGate(node) && isInhibitGate(node.type)) {
        return FTNodeType.INHIBIT;
    }
    return FTNodeType.UNDEFINED;
}

/** Sorts every gate with its type and puts them into a two dimensional array
 * @param gates Every gate within the FTAModel
 * @returns A two dimensional array with every gate sorted into the respective category of And, Or, KN, Inhibit-Gate
 */
export function getAllGateTypes(gates: Gate[]): Map<string, AstNode[]> {
    const allGates: Map<string, AstNode[]> = new Map();

    const andGates: AstNode[] = [];
    const orGates: AstNode[] = [];
    const kNGates: AstNode[] = [];
    const inhibGates: AstNode[] = [];

    for (const gate of gates) {
        if (isAND(gate.type)) {
            andGates.push(gate);
        } else if (isOR(gate.type)) {
            orGates.push(gate);
        } else if (isKNGate(gate.type)) {
            kNGates.push(gate);
        } else if (isInhibitGate(gate.type)) {
            inhibGates.push(gate);
        }
    }

    allGates.set("AND", andGates);
    allGates.set("OR", orGates);
    allGates.set("KNGate", kNGates);
    allGates.set("InhibitGate", inhibGates);
    return allGates;
}

/**
 * Takes all cut sets and returns a string that resembles it, so it can be displayed in the console.
 * @param cutSets The cut sets of the current Fault Tree.
 * @param idCache The idCache of the generator context from the current graph.
 * @returns a string that contains every cut set.
 */
export function cutSetToString(cutSets: AstNode[][], idCache: IdCache<AstNode>): string {
    const result = "The resulting " + cutSets.length + " cut sets are: \n";
    return setToString(cutSets, idCache, result);
}

/**
 * Takes all minimal cut sets and returns a string that resembles it, so it can be displayed in the console.
 * @param minimalCutSets The minimal cut sets of the current Fault Tree.
 * @param idCache The idCache of the generator context from the current graph.
 * @returns a string that contains every minimal cut set.
 */
export function minimalCutSetToString(minimalCutSets: AstNode[][], idCache: IdCache<AstNode>): string {
    const result = "The resulting " + minimalCutSets.length + " minimal cut sets are: \n";
    return setToString(minimalCutSets, idCache, result);
}

/**
 * Takes all (minimal) cut sets and returns a string that resembles it, so it can be displayed in the console.
 * @param cutSets The (minimal) cut sets of the current Fault Tree.
 * @returns A string that resembles the cut sets.
 */
export function setToString(cutSets: AstNode[][], idCache: IdCache<AstNode>, result: string): string {
    result += "[";

    for (const set of cutSets) {
        result += "[";
        for (const element of set) {
            if (set.indexOf(element) === set.length - 1) {
                result += idCache.getId(element);
            } else {
                result = result + idCache.getId(element) + ",";
            }
        }
        result += "]";
        if (cutSets.indexOf(set) === cutSets.length - 1) {
            result += "]\n";
        } else {
            result += ",\n";
        }
    }

    return result;
}
