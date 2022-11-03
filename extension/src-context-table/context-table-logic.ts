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

import { BigCell, checkValues, reappendValNames } from "./utils";



//TODO: evaluate
/**
 * Completes a non-header row with the calculated values for the "Hazardous?"-column.
 * @param parent The row to apply the values to.
 * @param result The results calculated with the getResult method.
 * @param index The number of columns the "Hazardous?"-column currently has.
 */
export function createResults(result: [string, number, string[]][], index: number): BigCell[] {
    const cells: BigCell[] = [];
    // check if the first result comes with a 0, which is the indicator that all columns should
    // simply be filled with a single "No" 
    const firstRes = result[0];
    // if there is no 0, then there is at least one rule to be applied
    if (firstRes[1] != 0) {
        // push all the numbers from result into a separate array
        let numbers: number[] = [];
        let counter: number = 0;
        result.forEach(res => {
            numbers.push(res[1]);
        });
        // go through all of the hazardous columns
        for (let i = 1; i <= index; i++) {
            // if there is an entry in the numbers that equals the current, a rule from result should be applied now
            if (numbers.includes(i)) {
                if (counter != 0) {
                    cells.push({ cssClass: "result", value: "No", colSpan: counter });
                }
                let numberIndex = numbers.indexOf(i);
                let iRes = result[numberIndex];

                cells.push({ cssClass: "result", value: iRes[2].toString(), colSpan: 1 });

                // entry.title = iRes[0];
            } else {
                // else, there is no rule for this cell
                counter = counter + 1;
                if (i == index && counter != 0) {
                    cells.push({ cssClass: "result", value: "No", colSpan: counter });
                }
            }
        }
    } else {
        // else, there is no rule for the entire row, so it's filled in with a single "No"
        cells.push({ cssClass: "result", value: firstRes[0], colSpan: index });
    }
    return cells;
}

// TODO: evalaute
/**
 * Calculates if a control action is hazardous or not
 * given a specified context using the rules defined in the .stpa file.
 * @returns If the action is hazardous, returns an array with all the rules (ID as string) that apply as well as their types (as number).
 * Else, returns string "No" to be applied to all of the "Hazardous"-column's columns.
 * 
 */
export function getResult(values: string[], rules: any[], currentController: string, selectedAction: string, selectedType: number, currentVariables: any[]): [string, number, string[]][] {
    const varVals = reappendValNames(values, currentVariables);
    // create an empty array for the end result
    let resultList: [string, number, string[]][] = [];
    // check all the rules
    rules.forEach(rule => {
        // check if the control action applies first
        const ruleAction = rule[1];
        if (ruleAction[0] == currentController && ruleAction[1] == selectedAction) {
            // check if the context applies next
            if (checkValues(rule[3], varVals)) {
                // convert the given type string to lowercase
                const typeString = rule[2] as string;
                const checkString = typeString.toLowerCase();
                // check if it is one of the accepted types that can be worked with,
                // if so, push rule onto the end result array with a fitting indicator as to what cell to write the rule in
                // this depends on the selected action type in the selector element
                switch (selectedType) {
                    case 0:
                        if (checkString == "anytime") { resultList.push([rule[0], 1, rule[4]]); return; };
                        if (checkString == "too early" || checkString == "too late") { resultList.push([rule[0], 2, rule[4]]); return; };
                        if (checkString == "stopped too soon" || checkString == "applied too long") { resultList.push([rule[0], 3, rule[4]]); return; };
                        break;
                    case 1:
                        if (checkString == "not provided" || checkString == "never") { resultList.push([rule[0], 0, rule[4]]); return; };
                        break;
                    case 2:
                        if (checkString == "anytime") { resultList.push([rule[0], 1, rule[4]]); return; };
                        if (checkString == "too early" || checkString == "too late") { resultList.push([rule[0], 2, rule[4]]); return; };
                        if (checkString == "stopped too soon" || checkString == "applied too long") { resultList.push([rule[0], 3, rule[4]]); return; };
                        if (checkString == "not provided" || checkString == "never") { resultList.push([rule[0], 4, rule[4]]); return; };
                        break;
                }
            }
        }
    });
    // if the result array remains empty, there is no rule, so push a single "No"
    if (resultList.length == 0) {
        resultList.push(["No", 0, []]);
    }
    return resultList;
}