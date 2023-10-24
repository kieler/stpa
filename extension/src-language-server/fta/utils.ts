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

import { Range } from "vscode-languageserver";
import { Component, Condition, Gate, ModelFTA, TopEvent, isAND, isInhibitGate, isKNGate, isOR } from "../generated/ast";

export type namedFtaElement = Component | Condition | Gate | TopEvent;

/**
 * Translates the cut sets in the given {@code cutSets} to strings.
 * @param cutSets The list containing the cut sets to translate.
 * @returns a list containing the cut sets in {@code cutSets} as a string.
 */
export function cutSetsToString(cutSets: Set<namedFtaElement>[]): string[] {
    const result: string[] = [];
    for (const set of cutSets) {
        const newSet: string[] = [];
        set.forEach((element) => newSet.push(element.name));
        result.push(`[${newSet.join(", ")}]`);
    }
    return result;
}

/**
 * Determines the range of the component identified by {@code label} in the editor,
 * @param model The current STPA model.
 * @param label The label of the searched component.
 * @returns The range of the component idenified by the label or undefined if no component was found.
 */
export function getRangeOfNodeFTA(model: ModelFTA, label: string): Range | undefined {
    let range: Range | undefined = undefined;
    const elements: namedFtaElement[] = [model.topEvent, ...model.components, ...model.conditions, ...model.gates];
    elements.forEach((component) => {
        if (component.name === label) {
            range = component.$cstNode?.range;
            return;
        }
    });
    return range;
}

/**
 * Serializes an FTA AST.
 * @param model The model of the FTA AST to serialize.
 * @returns the result of the serialization.
 */
export function serializeFTAAST(model: ModelFTA): string {
    let result = "";
    if (model.components && model.components.length !== 0) {
        result += "Components\n";
        model.components.forEach((component) => (result += `${component.name} "${component.description}"\n`));
    }
    if (model.conditions && model.conditions.length !== 0) {
        result += "Conditions\n";
        model.conditions.forEach((condition) => (result += `${condition.name} "${condition.description}"\n`));
    }
    if (model.topEvent) {
        result += "TopEvent\n";
        result += `"${model.topEvent.name}" = ${model.topEvent.child.$refText}\n`;
    }
    if (model.gates && model.gates.length !== 0) {
        result += "Gates\n";
        model.gates.forEach((gate) => {
            if (isAND(gate)) {
                result += `${gate.name} = ${gate.children.join(" and ")}\n`;
            } else if (isOR(gate)) {
                result += `${gate.name} = ${gate.children.join(" or ")}\n`;
            } else if (isKNGate(gate)) {
                result += `${gate.name} = ${gate.k} of ${gate.children.join(", ")}\n`;
            } else if (isInhibitGate(gate)) {
                result += `${gate.name} = ${gate.condition} inhibits ${gate.children.join("")}\n`;
            }
        });
    }
    return result;
}
