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
import { Component, Condition, Gate, ModelFTA, TopEvent } from "../generated/ast";

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
    const elements: namedFtaElement[] = [
        model.topEvent,
        ...model.components,
        ...model.conditions,
        ...model.gates
    ];
    elements.forEach((component) => {
        if (component.name === label) {
            range = component.$cstNode?.range;
            return;
        }
    });
    return range;
}