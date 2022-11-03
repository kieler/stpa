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

export class BigCell extends Cell {
    public colSpan: number
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

    //TODO: evaluate
    /**
     * Checks if the assigned values of a rule equal the assigned values of the current row.
     * @param ruleVars The assigned values of a rule.
     * @param varVals The assigned values of the current row.
     * @returns true if all values are equal; false otherwise.
     */
     export function checkValues(ruleVars: any[], varVals: any[]): boolean {
        // a boolean to iteratively check if values have been flagged as not equal, which should end the method
        let checks: boolean = true;
        // for all variables of the rule
        for(let i = 0; i < ruleVars.length && checks; i++) {
            // get the current variable with required value
            const currentVarVal = ruleVars[i];
            // load the row's current variable names and values into separate arrays
            const theVars = varVals[0] as any[];
            const theVals = varVals[1] as any[];
            // get the index of the value pair in the row array that the current iteration wants to compare
            const index = theVars.indexOf(currentVarVal[0]);
            // use that index to compare the rule's required value with the matching row's current value
            if (currentVarVal[1] != theVals[index]) {checks = false;}
        }
        return checks;
    }

    
    //TODO: evaluate
    /**
     * Gets the variable names from the currentContext Array
     * and returns it together with the array of the current row's values.
     * @param values The array containing the values that have been assigned to the context variables in the current row.
     * @returns An array containing both the variable-names array and the assigned-values array.
     * The indices for each variable and its assigned value sync up.
     */
     export function reappendValNames(values: string[], currentVariables: any[]) {
        // create empty array for end result
        let valuesOfVariables: any[] = [];
        // create an empty array for the variable names
        let currentVars: any[] = [];
        // filter all the variable names out of the variable data and append them to the array
        for (let i = 0; i < values.length; i++) {
            const currentVar = currentVariables[i];
            currentVars.push(currentVar[0]);
        }
        // push both the variable name array and the value array into the end result array 
        valuesOfVariables.push(currentVars);
        valuesOfVariables.push(values);
        return valuesOfVariables;
    }