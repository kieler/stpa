/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import { VNode } from "snabbdom";
import { createSelector, createText, patch } from "./html";

export class ControlAction {
    controller: string
    action: string
}

export class SystemVariables {
    system: string
    variables: Variable[]
}

export class Variable {
    name: string
    values: string[]
}

/**
 * Concats the elements in the lists in {@code list} by combining the entries with a dot.
 * @param list A list containing lists that should be flattened.
 * @returns A list containing the reuslting strings.
 */
export function createStrings(list: (string[])[]) {
    let stringList : string[] = [];
    list.forEach(item => {
        let combineStr = "";
        for (const str of item) {
            combineStr += str + ".";
        }
        // delete last dot
        combineStr = combineStr.substring(0, combineStr.length - 1)
        stringList.push(combineStr);
    })
    return stringList;
}

/**
 * Creates a new selector with the given {@code options} that replaces the given {@code selector}.
 * @param selector The selection element to replace.
 * @param options A list of options the new selector should have.
 * @param index The selected index of the selector.
 * @returns A new selector VNode.
 */
 export function replaceSelector(selector: HTMLSelectElement, options: string[], index: number): VNode {
    const newSelector = createSelector(selector.id, index, options, selector.style.top, selector.style.left)
    patch(selector, newSelector)
    return newSelector
}

/**
 * Adds a text element to {@code parent} with the given attributes.
 * @param parent Element to which the text should be added.
 * @param text The text that should be added.
 * @param topDistance The distance of the text to the top border.
 */
export function addText(parent: HTMLElement, text: string, topDistance: string): void {
    const placeholderActionDescriptions = document.createElement("pre");
    parent.appendChild(placeholderActionDescriptions);
    const actionDescriptions = createText(text, topDistance);
    patch(placeholderActionDescriptions, actionDescriptions);
}

/**
 * Adds a selector element to {@code parent} with the given attributes.
 * @param parent Element to which the selector should be added.
 * @param id The id of the selector.
 * @param index Selected Index of the selector.
 * @param options The options the selector contains.
 * @param topDistance The distance of the text to the top border.
 * @param leftDistance The distance of the text to the left border.
 */
export function addSelector(parent: HTMLElement, id: string, index: number, options: string[], topDistance: string, leftDistance: string): void {
    const placeholderTypeSelector = document.createElement("select");
    parent.append(placeholderTypeSelector)
    const typeSelector = createSelector(id, index, options, topDistance, leftDistance);
    patch(placeholderTypeSelector, typeSelector);
}