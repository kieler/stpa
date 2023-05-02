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

import * as vscode from 'vscode';
import { EMPTY_STATE_NAME, LTLFormula, State, Transition, UCA_TYPE, Variable } from "./utils";
import { createSCChartText, createSCChartFile } from "./scchart-creation";

/**
 * Creates a safe behavioral model for each controller.
 * @param controlActionsMap The control actions for each controller.
 * @param formulaMap The ltl formulas for each controller.
 */
export function createSBMs(controlActionsMap: Record<string, string[]>, formulaMap: Record<string, LTLFormula[]>): void {
    Object.keys(controlActionsMap).forEach(controller => createControllerSBM(controller, controlActionsMap[controller], formulaMap[controller]));
}

/**
 * Creates a safe behavioral model with the given components.
 * @param controllerName The name of the controller to model.
 * @param controlActions The control actions of the controller.
 * @param ltlFormulas The ltl formulas for the controller.
 * @returns 
 */
async function createControllerSBM(controllerName: string, controlActions: string[], ltlFormulas: LTLFormula[]): Promise<void> {
    // Ask the user where to save the sbm
    const currentFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
    const uri = await vscode.window.showSaveDialog({
        filters: { SCChart: ['sctx'] },
        // TODO: not possible with current vscode version
        // title: 'Save SBM to...',
        defaultUri: currentFolder ? vscode.Uri.file(`${currentFolder}/sbm.sctx`) : undefined,
    });
    if (uri === undefined) {
        // The user did not pick any file to save to.
        return;
    }

    // group formulas and create states for control actions
    const formulaMap = groupFormulasByAction(ltlFormulas);
    const states = createStatesForActions(controlActions);
    // add transitions to the states
    for (const controlAction of formulaMap.keys()) {
        // if formulas is undefined, no formulas exist for the control action
        const formulas = formulaMap.get(controlAction);
        if (formulas !== undefined) {
            addTransitions(states, controlAction, formulas);
        }
    }
    // the same triggers may be used for multiple transitions. Especially the transitions to the empty state can be deleted when the triggers are used by other transitions
    removeDublicateTransitions(states);

    // determine the variables for the scchart includign a variable for the controlaction
    const controlActionVariable = { name: "controlAction", type: `ref ${controllerName}` };
    const variables = [controlActionVariable].concat(collectContextVariables(ltlFormulas));
    // create the scchart
    const scchartText = createSCChartText(controllerName, states, variables, ltlFormulas, controlActions.concat(["NULL"]));
    createSCChartFile(uri.path, scchartText);
}

/**
 * Collects the context variables that occur in the {@code ltlFormulas}.
 * @param ltlFormulas The formulas which context variables should be collected.
 * @returns the context variables that occur in the {@code ltlFormulas}.
 */
function collectContextVariables(ltlFormulas: LTLFormula[]): Variable[] {
    // variables should not be collected more than once
    const variableNames = new Set<string>;
    const variables: Variable[] = [];
    ltlFormulas.forEach(ltlFormula => {
        // the variables are connected by logical ands
        const expressions = ltlFormula.contextVariables.split("&&");
        expressions.forEach(expression => {
            const operands = expression.split(/>=|<=|>|<|==|!=/);
            if (operands.length === 1) {
                // variable is a boolean
                let varName = "";
                if (operands[0].trim().charAt(0) === '!') {
                    varName = operands[0].trim().substring(1);
                } else {
                    varName = operands[0].trim();
                }
                if (!variableNames.has(varName)) {
                    variableNames.add(varName);
                    variables.push({ name: varName, type: "bool" });
                }
            } else {
                // operands may be variables or numbers so we need to check that before collecting them
                const firstOperand = operands[0].trim();
                const secondOperand = operands[1].trim();
                if (!variableNames.has(firstOperand) && !isNumber(firstOperand)) {
                    variableNames.add(firstOperand);
                    variables.push({ name: firstOperand, type: "int" });
                }
                if (!variableNames.has(secondOperand) && !isNumber(secondOperand)) {
                    variableNames.add(secondOperand);
                    variables.push({ name: secondOperand, type: "int", input: true });
                }
            }
        });
    });
    return variables;
}

/**
 * Checks whether {@code text} is a number.
 * @param text The operand check.
 * @returns true if {@code text} is a number.
 */
function isNumber(text: string): boolean {
    return !isNaN(parseInt(text));
}

/**
 * Determines the control action the {@code ltlFormula} is defined for.
 * @param ltlFormula The ltl formula for which the control action should be determined.
 * @returns the control action the {@code ltlFormula} is defined for.
 */
function getControlActionFromLTL(ltlFormula: LTLFormula): string {
    // Calculation based on the assumption that the control action is stated first in the description and has the form <controller.action>
    const startIndex = ltlFormula.description.indexOf(".");
    const endIndex = ltlFormula.description.indexOf(" ");
    const action = ltlFormula.description.substring(startIndex + 1, endIndex);
    return action;
}

/**
 * Groups the {@code ltlFormulas} by their control action.
 * @param ltlFormulas The ltl formulas to group.
 * @returns the {@code ltlFormulas} grouped by their control action.
 */
function groupFormulasByAction(ltlFormulas: LTLFormula[]): Map<string, LTLFormula[]> {
    const map: Map<string, LTLFormula[]> = new Map<string, LTLFormula[]>();
    ltlFormulas.forEach(formula => {
        const action = getControlActionFromLTL(formula);
        const formulaList = map.get(action);
        if (formulaList === undefined) {
            map.set(action, [formula]);
        } else {
            formulaList.push(formula);
        }
    });
    return map;
}

/**
 * Creates a state for each of the {@code controlActions}.
 * @param controlActions The control actions for which states should be created.
 * @returns the states representing the {@code controlActions}.
 */
function createStatesForActions(controlActions: string[]): State[] {
    // one state representing that no control action is active
    const states: State[] = [{
        name: EMPTY_STATE_NAME,
        controlAction: "NULL",
        transitions: []
    }];
    // adds a state for each control action
    controlActions.forEach(controlAction => {
        const state: State = {
            name: controlAction,
            controlAction: controlAction,
            transitions: []
        };
        states.push(state);
    });
    return states;
}

/**
 * Adds transitions to the {@code states} such that the {@code ltlFormulas} for the {@code controlAction} are respected.
 * @param states The states of the SBM.
 * @param controlAction The control action which ltl formulas are translated.
 * @param ltlFormulas The ltl formulas for the {@code controlAction}.
 */
function addTransitions(states: State[], controlAction: string, ltlFormulas: LTLFormula[]): void {
    const controlActionStateIndex = states.findIndex(state => state.name === controlAction);
    const controlActionState = states[controlActionStateIndex];
    ltlFormulas.forEach(ltlFormula => {
        switch (ltlFormula.type) {
            case UCA_TYPE.PROVIDED:
                // transition from controlaction state to the empty state
                const transition = {
                    target: EMPTY_STATE_NAME,
                    trigger: ltlFormula.contextVariables
                };
                controlActionState.transitions.push(transition);
                break;
            case UCA_TYPE.NOT_PROVIDED:
                states.forEach((state, index) => {
                    if (index !== controlActionStateIndex) {
                        // transition from all other states to the controlaction state
                        const transition = {
                            target: controlActionState.name,
                            trigger: ltlFormula.contextVariables
                        };
                        // transition must have the highest priority
                        const newTransitions: Transition[] = [transition];
                        newTransitions.push(...state.transitions);
                        state.transitions = newTransitions;
                    }
                });
                break;
            // TODO: implement
            case UCA_TYPE.TOO_LATE:
            case UCA_TYPE.APPLIED_TOO_LONG:
            case UCA_TYPE.STOPPED_TOO_SOON:
            default: break;
        }
    });
}

/**
 * Removes transitions that are unnecessary because their triggers are the same to transitions with higher priorities.
 * @param states The states of the model which transitions should be updated.
 */
function removeDublicateTransitions(states: State[]): void {
    states.forEach(state => {
        const triggers = new Set<string>;
        const deleteTransitions = new Set<number>;
        state.transitions.forEach((transition, index) => {
            if (transition.trigger && triggers.has(transition.trigger)) {
                if (transition.target === EMPTY_STATE_NAME) {
                    deleteTransitions.add(index);
                } else {
                    // TODO: inform the user that priorities cannot be inferred
                }
            }
            if (transition.trigger) {
                triggers.add(transition.trigger);
            }
        });
        state.transitions = state.transitions.filter((_, index) => !deleteTransitions.has(index));
    });
}

