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

import { DCARule, Model, Rule, Variable, isRule } from "../../generated/ast";
import { LangiumSprottySharedServices } from "langium-sprotty";
import { Reference } from 'langium';
import { URI } from 'vscode-uri';
import { getModel } from "../../utils";


/**
 * Respresents an LTL formula.
 */
class LTLFormula {
    /** LTL formula */
    formula: string;
    /** description of the LTL formula */
    description: string;
    /** UCA that was used to create the LTL formula */
    ucaId: string;

    contextVariables: string;
    type: string;
}

/**
 * Provides the different UCA types.
 */
class UCA_TYPE {
    static NOT_PROVIDED = "not-provided";
    static PROVIDED = "provided";
    static TOO_EARLY = "too-early";
    static TOO_LATE = "too-late";
    static APPLIED_TOO_LONG = "applied-too-long";
    static STOPPED_TOO_SOON = "stopped-too-soon";
    static WRONG_TIME = "wrong-time";
    static UNDEFINED = "undefined";
}

/**
 * Generates the LTL formulae for the UCAs in the file given by {@code uri}.
 * @param uri URI of the file for which the LTL should be generated.
 * @param shared Langium/Sprotty services.
 * @returns LTL formulae for the UCAs in the given model.
 */
export async function generateLTLFormulae(uri: string, shared: LangiumSprottySharedServices): Promise<Record<string, LTLFormula[]>> {
    // get the current model
    let model = getModel(uri, shared);

    // references are not found if the stpa file has not been opened since then the linter has not been activated yet
    if (model.rules.length > 0 && model.rules[0]?.contexts[0]?.vars[0]?.ref === undefined) {
        // build document
        await shared.workspace.DocumentBuilder.update([URI.parse(uri)], []);
        // update the model
        model = getModel(uri, shared);
    }
    // ltl formulas are saved per controller
    const map: Record<string, LTLFormula[]> = {};
    await translateUCAsToLTLFormulas(model, map);
    await translateDCAsToLTLFormulas(model, map);
    return map;
}

async function translateDCAsToLTLFormulas(model: Model, map: Record<string, LTLFormula[]>): Promise<void> {
    if (model.allDCAs.length > 0 && model.allDCAs) {
        for (const rule of model.allDCAs) {
            translateRuleToLTLFormulas(rule, map);
        }
    }
}

async function translateUCAsToLTLFormulas(model: Model, map: Record<string, LTLFormula[]>): Promise<void> {
    if (model.rules.length > 0 && model.rules) {
        for (const rule of model.rules) {
            translateRuleToLTLFormulas(rule, map);
        }
    }
}

async function translateRuleToLTLFormulas(rule: Rule | DCARule, map: Record<string, LTLFormula[]>): Promise<void> {
    const controller = rule.system.$refText;
    // control action string
    const controlAction = controller + "." + rule.action.$refText;
    for (const uca of rule.contexts) {
        // calculate the contextVariable string
        let contextVariables = await createLTLContextVariable(uca.vars[0], uca.values[0]);
        for (let i = 1; i < uca.vars.length; i++) {
            contextVariables += "&&" + await createLTLContextVariable(uca.vars[i], uca.values[i]);
        }
        // translate uca based on the rule type
        const ltlString = createLTLString(rule, contextVariables, controlAction);
        const ltlFormula = { formula: ltlString.formula, description: ltlString.description, ucaId: uca.name, contextVariables, type: ltlString.type };
        // add ltl to the map based on the controller reponsible for the UCA
        const ltlList = map[controller];
        if (ltlList !== undefined) {
            ltlList.push(ltlFormula);
        } else {
            map[controller] = [ltlFormula];
        }
    }
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
        return enumValue(variable.$refText, value);
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
    return variable + (equal ? ">=" : "<") + value1 + " && " + variable + (equal ? "<=" : ">") + value2;
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
 * A LTL string for a variable with a given enum value.
 * @param variable The variable to create the LTL string for.
 * @param value The enum value of the variable.
 * @returns the LTL string for the given variable.
 */
const enumValue = (variable: string, value: string): string => {
    return variable + "==" + variable + "_Enum." + value;
};

/**
 * Creates the LTL string for the given arguments.
 * @param rule The rule that should be translated to a LTL.
 * @param contextVariables The string for the context variable values.
 * @param controlAction The controlaction for the rule.
 * @returns the LTL for the given arguments.
 */
function createLTLString(rule: Rule | DCARule, contextVariables: string, controlAction: string): { formula: string, description: string, type: string; } {
    if (isRule(rule)) {
        switch (rule.type) {
            case UCA_TYPE.NOT_PROVIDED:
                return notProvidedLTL(contextVariables, controlAction);
            case UCA_TYPE.PROVIDED:
                return providedLTL(contextVariables, controlAction);
            case UCA_TYPE.TOO_EARLY:
                return tooEarlyLTL(contextVariables, controlAction);
            case UCA_TYPE.TOO_LATE:
                return tooLateLTL(contextVariables, controlAction);
            case UCA_TYPE.APPLIED_TOO_LONG:
                return appliedTooLongLTL(contextVariables, controlAction);
            case UCA_TYPE.STOPPED_TOO_SOON:
                return stoppedTooSoonLTL(contextVariables, controlAction);
            case UCA_TYPE.WRONG_TIME:
                return wrongTimeLTL(contextVariables, controlAction);
            default: return { formula: "", description: "", type: UCA_TYPE.UNDEFINED };
        }
    } else {
        switch (rule.type) {
            case UCA_TYPE.NOT_PROVIDED:
                return providedLTL(contextVariables, controlAction);
            case UCA_TYPE.PROVIDED:
                return notProvidedLTL(contextVariables, controlAction);
            default: return { formula: "", description: "", type: UCA_TYPE.UNDEFINED };
        }
    }
}

/**
 * LTL formula for the not provided rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the not provided rule type and a textual representation.
 */
const notProvidedLTL = (contextVariables: string, controlAction: string): { formula: string, description: string, type: string; } => {
    return {
        formula: "G ((" + contextVariables + ") -> (controlAction==" + controlAction + "))",
        description: controlAction + " provided in context " + contextVariables,
        type: UCA_TYPE.NOT_PROVIDED
    };
};
/**
 * LTL formula for the provided rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the provided rule type and a textual representation.
 */
const providedLTL = (contextVariables: string, controlAction: string): { formula: string, description: string, type: string; } => {
    return {
        formula: "G ((" + contextVariables + ") -> (controlAction!=" + controlAction + "))",
        description: controlAction + " not provided in context " + contextVariables,
        type: UCA_TYPE.PROVIDED
    };
};
/**
 * LTL formula for the too early rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the too eraly rule type and a textual representation.
 */
const tooEarlyLTL = (contextVariables: string, controlAction: string): { formula: string, description: string, type: string; } => {
    return {
        // formula: "G (((controlAction==" + controlAction + ") -> (" + contextVariables + ")) && !((controlAction==" + controlAction + ")U(" + contextVariables + ")))",
        formula: "G ((!(" + contextVariables + ") && X(" + contextVariables + ")) -> (controlAction!=" + controlAction + "))",
        description: controlAction + " not provided too early in context " + contextVariables,
        type: UCA_TYPE.TOO_EARLY
    };
};
/**
 * LTL formula for the too late rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the too late rule type and a textual representation.
 */
const tooLateLTL = (contextVariables: string, controlAction: string): { formula: string, description: string, type: string; } => {
    return {
        // formula: "G (((" + contextVariables + ") -> (controlAction==" + controlAction + ")) && !((" + contextVariables + ")U(controlAction==" + controlAction + ")))",
        formula: "((" + contextVariables + ") -> (controlAction==" + controlAction + ")) && G ((!(" + contextVariables + ")) -> (X((" + contextVariables + ") -> (controlAction==" + controlAction + "))))",
        description: controlAction + " not provided too late in context " + contextVariables,
        type: UCA_TYPE.TOO_LATE
    };
};
/**
 * LTL formula for the appplied too long rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the applied too long rule type and a textual representation.
 */
const appliedTooLongLTL = (contextVariables: string, controlAction: string): { formula: string, description: string, type: string; } => {
    return {
        formula: "G ((" + contextVariables + " && controlAction==" + controlAction + ") -> (X((!(" + contextVariables + ")) -> controlAction!=" + controlAction + ")))",
        description: controlAction + " not applied too long in context " + contextVariables,
        type: UCA_TYPE.APPLIED_TOO_LONG
    };
};
/**
 * LTL formula for the stopped too soon rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the stopped too soon rule type and a textual representation.
 */
const stoppedTooSoonLTL = (contextVariables: string, controlAction: string): { formula: string, description: string, type: string; } => {
    return {
        formula: "G ((" + contextVariables + " && controlAction==" + controlAction + ") -> (X((controlAction!=" + controlAction + ") -> (!(" + contextVariables + ")))))",
        description: controlAction + " not stopped too soon in context " + contextVariables,
        type: UCA_TYPE.STOPPED_TOO_SOON
    };
};
/**
 * LTL formula for the wrong time rule type.
 * @param contextVariables The used context variables that are already translated to string for the LTL formula.
 * @param controlAction The inspected control action that is already translated to string for the LTL formula.
 * @returns the LTL formula for the wrong time rule type and a textual representation.
 */
const wrongTimeLTL = (contextVariables: string, controlAction: string): { formula: string, description: string, type: string; } => {
    const tooEarly = tooEarlyLTL(contextVariables, controlAction);
    const tooLate = tooLateLTL(contextVariables, controlAction);
    return {
        formula: tooEarly.formula + " && " + tooLate.formula,
        description: controlAction + " not provided at the wrong time in context " + contextVariables,
        type: UCA_TYPE.WRONG_TIME
    };
};