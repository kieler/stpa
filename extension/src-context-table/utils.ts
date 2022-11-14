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

import { Cell } from "@kieler/table-webview/lib/helper";
import { VNode } from "snabbdom";
import { createSelector, createText, patch } from "./html";

/** Type for control actions for the context table. */
export class ContexTableControlAction {
    controller: string;
    action: string;
}

/** The variables for each system, needed for the context table. */
export class ContexTableSystemVariables {
    system: string;
    variables: ContexTableVariableValues[];
}

/** The possible values for a variable in the context table. */
export class ContexTableVariableValues {
    name: string;
    values: string[];
}

/** An instantation of a variable, needed for the contexts in the context table. */
export class ContexTableVariable {
    name: string;
    value: string;
}

/** A rule for the context table. */
export class ContexTableRule {
    id: string;
    controlAction: ContexTableControlAction;
    type: string;
    variables: ContexTableVariable[];
    hazards: string[];
    column?: number;
}

/** Data the context table expects from the language server. */
export class ContextTableData {
    rules: ContexTableRule[];
    actions: ContexTableControlAction[];
    systemVariables: ContexTableSystemVariables[];
}

/** Types of control actions. */
export enum Type {
    PROVIDED,
    NOT_PROVIDED,
    BOTH
}

/** A cell in the context table. */
export class BigCell extends Cell {
    colSpan: number;
    title?: string;
}

/** A row in the context table. */
export class Row {
    variables: ContexTableVariable[];
    results: { hazards: string[], rules: ContexTableRule[]; }[];
}

/**
 * Concats the elements of each controlaction in {@code controlactions} with a dot.
 * @param controlactions A list containing controlactions that should be converted to strings.
 * @returns A list containing the resulting strings.
 */
export function convertControlActionsToStrings(controlactions: ContexTableControlAction[]): string[] {
    let result: string[] = [];
    controlactions.forEach(controlAction => {
        let combineStr = controlAction.controller + "." + controlAction.action;
        result.push(combineStr);
    });
    return result;
}

/**
 * Creates a new selector with the given {@code options} that replaces the given {@code selector}.
 * @param selector The selection element to replace.
 * @param options A list of options the new selector should have.
 * @param index The selected index of the selector.
 * @returns A new selector VNode.
 */
export function replaceSelector(selector: HTMLSelectElement, options: string[], index: number): VNode {
    const newSelector = createSelector(selector.id, index, options, selector.style.top, selector.style.left);
    patch(selector, newSelector);
    return newSelector;
}

/**
 * Adds a text element to {@code parent} with the given attributes.
 * @param parent Element to which the text should be added.
 * @param text The text that should be added.
 */
export function addText(parent: HTMLElement, text: string): void {
    const placeholderActionDescriptions = document.createElement("pre");
    parent.appendChild(placeholderActionDescriptions);
    const actionDescriptions = createText(text);
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
    parent.append(placeholderTypeSelector);
    const typeSelector = createSelector(id, index, options, topDistance, leftDistance);
    patch(placeholderTypeSelector, typeSelector);
}
