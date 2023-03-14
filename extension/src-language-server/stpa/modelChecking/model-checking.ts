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

import { Context, Model, Rule, Variable } from "../../generated/ast";

class LTLFormula {
    formula: string;
    text: string;
    ucaId: string;
}

/**
 * Generates the LTL formulae for {@code model}.
 * @param model The model containing the UCAs which should be translated to LTLs.
 * @returns LTL formulae for the UCAs in the given model.
 */
export function generateLTLFormulae(model: Model): LTLFormula[] {
    const result: LTLFormula[] = [];
    if (model.rules) {
        for (const rule of model.rules) {
            // control action string
            const controlAction = rule.system.$refText + "_" + rule.action.$refText;
            for (const uca of rule.contexts) {
                // calculate the contextVariable string
                let contextVariables = createLTLContextVariable(uca, 0);
                for (let i = 1; i < uca.vars.length; i++) {
                    contextVariables += "&&" + createLTLContextVariable(uca, i);
                }
                // translate uca based on the rule type
                const ltlString = createLTLString(rule, contextVariables, controlAction);

                result.push({ formula: ltlString.formula, text: ltlString.text, ucaId: uca.name });
            }
        }
    }
    return result;
}

function createLTLContextVariable(uca: Context, index: number): string {
    // TODO: reference is not found if the stpa file has not been opened since then the linter has not been activated yet
    const variableValue = uca.vars[index].ref?.values?.find(value => value.name === uca.values[index]);
    if (variableValue === undefined || variableValue?.firstValue === undefined) {
        return uca.vars[index].$refText + "==" + uca.values[index];
    } else if (variableValue.secondValue === undefined) {
        return uca.vars[index].$refText + "==" + variableValue.firstValue;
    } else {
        if (variableValue.firstValue === "MIN") {
            return uca.vars[index].$refText + "<=" + variableValue.secondValue;
        } else if (variableValue.secondValue === "MAX") {
            return uca.vars[index].$refText + ">=" + variableValue.firstValue;
        } else {
            return "(" + uca.vars[index].$refText + "<=" + variableValue.secondValue + " && " + uca.vars[index].$refText + ">=" + variableValue.firstValue + ")";
        }
    }
}

function createLTLString(rule: Rule, contextVariables: string, controlAction: string): { formula: string, text: string; } {
    let formula = "";
    let text = "";
    switch (rule.type) {
        case "not-provided":
            formula = "G ((" + contextVariables + ") -> (controlAction==" + controlAction + "))";
            text = controlAction + " provided in context " + contextVariables;
            break;
        case "provided":
            formula = "G ((" + contextVariables + ") -> !(controlAction==" + controlAction + "))";
            text = controlAction + " not provided in context " + contextVariables;
            break;
        case "too-early":
            formula = "G (((controlAction==" + controlAction + ") -> (" + contextVariables + ")) && !((controlAction==" + controlAction + ")U(" + contextVariables + ")))";
            text = controlAction + " not provided too early in context " + contextVariables;
            break;
        case "too-late":
            formula = "G (((" + contextVariables + ") -> (controlAction==" + controlAction + ")) && !((" + contextVariables + ")U(controlAction==" + controlAction + ")))";
            text = controlAction + " not provided too late in context " + contextVariables;
            break;
        // TODO momentarily not supported
        case "wrong-time":
        case "applied-too-long":
        case "stopped-too-soon":
        default: break;
    }
    return { formula, text };
}

