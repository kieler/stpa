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
import { isTopEvent, isComponent, isCondition, isGate, isAND, isOR, isKNGate, isInhibitGate, Gate } from "../../generated/ast";
import { FTNodeType } from "./fta-model";

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
    } else if (isAND(node)) {
        return FTNodeType.AND;
    } else if (isOR(node)) {
        return FTNodeType.OR;
    } else if (isKNGate(node)) {
        return FTNodeType.KN;
    } else if (isInhibitGate(node)) {
        return FTNodeType.INHIBIT;
    }
    return FTNodeType.UNDEFINED;
}


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
        for (const ref of node.children) {
            if (ref?.ref) {
                targets.push(ref.ref);
            }
        }
        if (isInhibitGate(node)) {
            for (const ref of node.condition) {
                if (ref?.ref) {
                    targets.push(ref.ref);
                }
            }
        }
    }
    return targets;
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
        if (isAND(gate)) {
            andGates.push(gate);
        } else if (isOR(gate)) {
            orGates.push(gate);
        } else if (isKNGate(gate)) {
            kNGates.push(gate);
        } else if (isInhibitGate(gate)) {
            inhibGates.push(gate);
        }
    }

    allGates.set("AND", andGates);
    allGates.set("OR", orGates);
    allGates.set("KNGate", kNGates);
    allGates.set("InhibitGate", inhibGates);
    return allGates;
}