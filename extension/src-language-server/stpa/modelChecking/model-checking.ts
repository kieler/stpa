/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2023 by
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

import { LangiumSprottySharedServices } from "langium-sprotty";
import { Context, Model, Rule } from "../../generated/ast";
import { getModel } from "../../utils";

import { URI } from 'vscode-uri';

/**
 * Respresents a ltl formula.
 */
class LTLFormula {
    /** formula of the LTL formula */
    formula: string;
    /** text representing the LTL formula */
    text: string;
    /** UCA that was used to create the LTL formula */
    ucaId: string;
}

/**
 * Generates the LTL formulae for the UCAs in the file given by {@code uri}.
 * @param uri URI of the file for which the LTL should be generated.
 * @param shared Langium/Sprotty services.
 * @returns LTL formulae for the UCAs in the given model.
 */
export async function generateLTLFormulae(uri: string, shared: LangiumSprottySharedServices): Promise<LTLFormula[]> {
    const result: LTLFormula[] = [];
    // get the current model
    let model = getModel(uri, shared);

    // references are not found if the stpa file has not been opened since then the linter has not been activated yet
    if (model.rules[0].contexts[0].vars[0].ref === undefined) {
        // build document
        await shared.workspace.DocumentBuilder.update([URI.parse(uri)], []);
        // update the model
        model = getModel(uri, shared);
    }

    if (model.rules) {
        for (const rule of model.rules) {
            // control action string
            const controlAction = rule.system.$refText + "_" + rule.action.$refText;
            for (const uca of rule.contexts) {
                // calculate the contextVariable string
                let contextVariables = await createLTLContextVariable(uca, 0);
                for (let i = 1; i < uca.vars.length; i++) {
                    contextVariables += "&&" + await createLTLContextVariable(uca, i);
                }
                // translate uca based on the rule type
                const ltlString = createLTLString(rule, contextVariables, controlAction);

                result.push({ formula: ltlString.formula, text: ltlString.text, ucaId: uca.name });
            }
        }
    }
    return result;
}

/**
 * Creates a string of a context variable value for the LTL formula.
 * @param uca UCA which context should be translated to a LTL.
 * @param index Index of the variable in the UCA which is currently inspected.
 * @returns the string for the currently inspected context variable.
 */
async function createLTLContextVariable(uca: Context, index: number): Promise<string> {
    //used variable in the uca
    let variable = uca.vars[index];
    // range definition of the used variable value in the UCA
    const valueRange = variable.ref?.values?.find(value => value.name === uca.values[index]);
    // variable name
    let ltl = variable.$refText;

    if (valueRange === undefined || valueRange?.firstValue === undefined) {
        // no value range defined for the value
        ltl += "==" + uca.values[index];
    } else if (valueRange?.operator === "!=") {
        // value is not in the given range
        if (valueRange.secondValue === undefined) {
            // only one value is given
            if (valueRange.firstValue === "true") {
                // we dont want to write "!= true"
                ltl = "!" + ltl;
            } else if (valueRange.firstValue !== "true") {
                ltl += "!=" + valueRange.firstValue;
            }
        } else {
            if (valueRange.firstValue === "MIN") {
                // MIN value is used 
                ltl += ">" + valueRange.secondValue;
            } else if (valueRange.secondValue === "MAX") {
                // MAX value is used
                ltl += "<" + valueRange.firstValue;
            } else {
                // two range values are given without use of MIN or MAX
                ltl = "(" + uca.vars[index].$refText + "<" + valueRange.firstValue + " && " + uca.vars[index].$refText + ">" + valueRange.secondValue + ")";
            }
        }
    } else {
        // value is in the given range
        if (valueRange.secondValue === undefined) {
            // only one value is given
            if (valueRange.firstValue === "false") {
                // we dont want to write "== false"
                ltl = "!" + ltl;
            } else if (valueRange.firstValue !== "true") {
                ltl += "==" + valueRange.firstValue;
            }
        } else {
            if (valueRange.firstValue === "MIN") {
                // MIN value is used 
                ltl += "<=" + valueRange.secondValue;
            } else if (valueRange.secondValue === "MAX") {
                // MAX value is used
                ltl += ">=" + valueRange.firstValue;
            } else {
                // two range values are given without use of MIN or MAX
                ltl = "(" + uca.vars[index].$refText + "<=" + valueRange.secondValue + " && " + uca.vars[index].$refText + ">=" + valueRange.firstValue + ")";
            }
        }
    }
    return ltl;
}

/**
 * Creates the LTL string for the given arguments.
 * @param rule The rule that should be translated to a LTL.
 * @param contextVariables The string for the context variable values.
 * @param controlAction The controlaction for the rule.
 * @returns the LTL for the given arguments.
 */
function createLTLString(rule: Rule, contextVariables: string, controlAction: string): { formula: string, text: string; } {
    switch (rule.type) {
        case "not-provided":
            return notProvidedLTL(contextVariables, controlAction);
        case "provided":
            return providedLTL(contextVariables, controlAction);
        case "too-early":
            return tooEarlyLTL(contextVariables, controlAction);
        case "too-late":
            return tooLateLTL(contextVariables, controlAction);
        // momentarily not supported
        case "wrong-time":
        case "applied-too-long":
        case "stopped-too-soon":
        default: return { formula: "", text: "" };
    }
}

/**
 * LTL formula for the not provided rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the not provided rule type and a textual representation.
 */
const notProvidedLTL = (contextVariables: string, controlAction: string): { formula: string, text: string; } => {
    return {
        formula: "G ((" + contextVariables + ") -> (controlAction==" + controlAction + "))",
        text: controlAction + " provided in context " + contextVariables
    };
};
/**
 * LTL formula for the provided rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the provided rule type and a textual representation.
 */
const providedLTL = (contextVariables: string, controlAction: string): { formula: string, text: string; } => {
    return {
        formula: "G ((" + contextVariables + ") -> !(controlAction==" + controlAction + "))",
        text: controlAction + " not provided in context " + contextVariables
    };
};
/**
 * LTL formula for the too early rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the too eraly rule type and a textual representation.
 */
const tooEarlyLTL = (contextVariables: string, controlAction: string): { formula: string, text: string; } => {
    return {
        formula: "G (((controlAction==" + controlAction + ") -> (" + contextVariables + ")) && !((controlAction==" + controlAction + ")U(" + contextVariables + ")))",
        text: controlAction + " not provided too early in context " + contextVariables
    };
};
/**
 * LTL formula for the too late rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the too late rule type and a textual representation.
 */
const tooLateLTL = (contextVariables: string, controlAction: string): { formula: string, text: string; } => {
    return {
        formula: "G (((" + contextVariables + ") -> (controlAction==" + controlAction + ")) && !((" + contextVariables + ")U(controlAction==" + controlAction + ")))",
        text: controlAction + " not provided too late in context " + contextVariables
    };
};
