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
import { Rule, Variable } from "../../generated/ast";
import { getModel } from "../../utils";
import { Reference } from 'langium';

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
                let contextVariables = await createLTLContextVariable(uca.vars[0], uca.values[0]);
                for (let i = 1; i < uca.vars.length; i++) {
                    contextVariables += "&&" + await createLTLContextVariable(uca.vars[i], uca.values[i]);
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
 * @param variable Reference to a variable that should be translated to a LTL formula string.
 * @param value Value of the variable.
 * @returns the string for the currently inspected context variable.
 */
async function createLTLContextVariable(variable: Reference<Variable>, value: string): Promise<string> {
    // range definition of the used variable value in the UCA
    const valueRange = variable.ref?.values?.find(variableRange => variableRange.name === value);

    if (valueRange === undefined || valueRange?.firstValue === undefined) {
        // no value range defined for the value
        return oneValue(variable.$refText, value, true);
    } else {
        if (valueRange.secondValue === undefined) {
            // only one value is given
            if (valueRange.firstValue === "false" || valueRange.firstValue === "true") {
                // given value is a boolean
                return booleanValue(variable.$refText, (valueRange?.operator === "=" && valueRange.firstValue === "true") || (valueRange?.operator === "!=" && valueRange.firstValue === "false"));
            } else {
                // given value is string or number
                return oneValue(variable.$refText, "" + valueRange.firstValue, valueRange?.operator === "=");
            }
        } else {
            if (valueRange.firstValue === "MIN") {
                // MIN value is used 
                return minAsRangeValue(variable.$refText, "" + valueRange.secondValue, valueRange?.operator === "=");
            } else if (valueRange.secondValue === "MAX") {
                // MAX value is used
                return maxAsRangeValue(variable.$refText, "" + valueRange.firstValue, valueRange?.operator === "=");
            } else {
                // two range values are given without use of MIN or MAX
                return twoRanges(variable.$refText, "" + valueRange.firstValue, "" + valueRange.secondValue, valueRange?.operator === "=");
            }
        }
    }
}

/**
 * A LTL string for a variable which value should be in a given range or outside of it.
 * @param variable The variable to create the LTL string for.
 * @param value1 The first value of the range.
 * @param value2 The second value of the range.
 * @param equal Determines whether the variable should be in the given range or outside of it.
 * @returns the LTL string for the given variable.
 */
const twoRanges = (variable: string, value1: string, value2: string, equal: boolean): string => {
    return "(" + variable + (equal ? ">=" : "<") + value1 + " && " + (equal ? "<=" : ">") + value2;
};
/**
 * A LTL string for a variable which value should be in or outside of a given range in which a MAX value is used as second value of the range.
 * @param variable The variable to create the LTL string for.
 * @param value The first value of the range.
 * @param equal Determines whether the variable should be in the given range or outside of it.
 * @returns the LTL string for the given variable.
 */
const maxAsRangeValue = (variable: string, value: string, equal: boolean): string => {
    return variable + (equal ? ">=" : "<") + value;
};
/**
 * A LTL string for a variable which value should be in or outside of a given range in which a MIN value is used as first value of the range.
 * @param variable The variable to create the LTL string for.
 * @param value The second value of the range.
 * @param equal Determines whether the variable should be in the given range or outside of it.
 * @returns the LTL string for the given variable.
 */
const minAsRangeValue = (variable: string, value: string, equal: boolean): string => {
    return variable + (equal ? "<=" : ">") + value;
};
/**
 * A LTL string for a variable which value is a boolean.
 * @param variable The variable to create the LTL string for.
 * @param equal Determines whether the variable should be true or false.
 * @returns the LTL string for the given variable.
 */
const booleanValue = (variable: string, equal: boolean): string => {
    return (equal ? "" : "!") + variable;
};
/**
 * A LTL string for a variable with a given value.
 * @param variable The variable to create the LTL string for.
 * @param value The value of the variable.
 * @param equal Determines whether the variable should be (un)equal to the value.
 * @returns the LTL string for the given variable.
 */
const oneValue = (variable: string, value: string, equal: boolean): string => {
    return variable + (equal ? "==" : "!=") + value;
};

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
