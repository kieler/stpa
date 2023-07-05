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
import { EMPTY_STATE_NAME, Enum, LTLFormula, State, Transition, UCA_TYPE, Variable } from "./utils";
import { createSCChartText } from "./scchart-creation";
import { createFile } from '../utils';

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
    const formulaMap = groupFormulasByActionAndType(ltlFormulas);
    let states = createStatesForActions(controlActions);
    // add transitions to the states
    // when adding transition for continous UCA types new states may be added
    states = addTransitions(formulaMap, states);

    // determine the variables for the scchart including a variable for the control action
    const controlActionVariable = { name: "controlAction", type: `ref ${controllerName}` };
    const contextVariables = collectContextVariables(ltlFormulas);
    const variables = contextVariables.variables.concat([controlActionVariable]);
    // create the scchart
    const scchartText = createSCChartText(controllerName, states, variables, contextVariables.enums, ltlFormulas, controlActions.concat(["NULL"]));
    createFile(uri.path, scchartText);
}

/**
 * Collects the context variables that occur in the {@code ltlFormulas}.
 * @param ltlFormulas The formulas which context variables should be collected.
 * @returns the context variables that occur in the {@code ltlFormulas}.
 */
function collectContextVariables(ltlFormulas: LTLFormula[]): { variables: Variable[], enums: Enum[]; } {
    // variables should not be collected more than once
    const variableNames = new Set<string>;
    const variables: Variable[] = [];
    const enums: Enum[] = [];
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
                // two integer operands
                const firstOperand = operands[0].trim();
                const secondOperand = operands[1].trim();
                addVariable(variableNames, variables, firstOperand, false);
                if (secondOperand.indexOf(".") !== -1) {
                    // second operand is an enum
                    addEnum(variableNames, enums, secondOperand, variables, firstOperand);
                } else {
                    addVariable(variableNames, variables, secondOperand, true);
                }
            }
        });
    });
    return { variables, enums };
}

/**
 * Adds an enum to the {@code enums} if it is not already contained.
 * @param variableNames Contains the names of the variables that are already contained in the {@code enums}.
 * @param enums The enums to which the enum should be added.
 * @param operand Name of the enum to add.
 * @param variables Contains the variables that are already collected.
 * @param variableName Name of the variable that is assigned a value of the enum.
 */
function addEnum(variableNames: Set<string>, enums: Enum[], operand: string, variables: Variable[], variableName: string): void {
    if (!variableNames.has(operand)) {
        const enumName = operand.substring(0, operand.indexOf("."));
        const enumValue = operand.substring(operand.indexOf(".") + 1);
        const enumDecl = enums.find(enumElement => enumElement.name === enumName);
        if (enumDecl === undefined) {
            enums.push({ name: enumName, values: [enumValue] });
        } else {
            enumDecl.values.push(enumValue);
        }
        // update the type of the first operand to enum
        const firstVariable = variables.find(variable => variable.name === variableName);
        if (firstVariable !== undefined && !firstVariable.type.startsWith("ref")) {
            firstVariable.type = "ref " + enumName;
        }
        // add the operand to the variables
        variableNames.add(operand);
    }
}

/**
 * Adds a variable to the {@code variables} if it is not already contained.
 * @param variableNames Contains the names of the variables that are already contained in the {@code variables}.
 * @param variables The variables to which the {@code operand} should be added.
 * @param operand Name of the variable that should be added.
 * @param input Determines whether the variable is an input variable.
 */
function addVariable(variableNames: Set<string>, variables: Variable[], operand: string, input: boolean): void {
    // operands may be variables or numbers so we need to check that before collecting them
    if (!variableNames.has(operand) && !isNumber(operand)) {
        variableNames.add(operand);
        variables.push({ name: operand, type: "int", input: input });
    }
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
 * Groups the {@code ltlFormulas} by their control action and UCA type.
 * @param ltlFormulas The ltl formulas to group.
 * @returns the {@code ltlFormulas} grouped by their control action and UCA type.
 */
function groupFormulasByActionAndType(ltlFormulas: LTLFormula[]): { notProvidedMap: Map<string, LTLFormula[]>, providedMap: Map<string, LTLFormula[]>, appliedTooLongMap: Map<string, LTLFormula[]>, stoppedTooSoonMap: Map<string, LTLFormula[]>; } {
    const notProvidedMap = new Map<string, LTLFormula[]>();
    const providedMap = new Map<string, LTLFormula[]>();
    const appliedTooLongMap = new Map<string, LTLFormula[]>();
    const stoppedTooSoonMap = new Map<string, LTLFormula[]>();
    ltlFormulas.forEach(formula => {
        const action = getControlActionFromLTL(formula);
        switch (formula.type) {
            case UCA_TYPE.NOT_PROVIDED:
            case UCA_TYPE.TOO_LATE:
                notProvidedMap.has(action) ? notProvidedMap.get(action)?.push(formula) : notProvidedMap.set(action, [formula]);
                break;
            case UCA_TYPE.PROVIDED:
                providedMap.has(action) ? providedMap.get(action)?.push(formula) : providedMap.set(action, [formula]);
                break;
            case UCA_TYPE.APPLIED_TOO_LONG:
                appliedTooLongMap.has(action) ? appliedTooLongMap.get(action)?.push(formula) : appliedTooLongMap.set(action, [formula]);
                break;
            case UCA_TYPE.STOPPED_TOO_SOON:
                stoppedTooSoonMap.has(action) ? stoppedTooSoonMap.get(action)?.push(formula) : stoppedTooSoonMap.set(action, [formula]);
                break;
            case UCA_TYPE.TOO_EARLY:
                // too early is not handled since it cannot be translated to transitions
                break;
        }
    });
    return { notProvidedMap, providedMap, appliedTooLongMap, stoppedTooSoonMap };
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
 * Adds transitions to the {@code states} such that the ltl Formulas in {@code maps} are respected.
 * @param maps The maps for each UCA type containing the LTL formulas for each control action.
 * @param states The states of the SBM.
 */
function addTransitions(maps: { notProvidedMap: Map<string, LTLFormula[]>, providedMap: Map<string, LTLFormula[]>, appliedTooLongMap: Map<string, LTLFormula[]>, stoppedTooSoonMap: Map<string, LTLFormula[]>; }, states: State[]): State[] {
    addNotProvidedTransitions(maps.notProvidedMap, states);
    addProvidedTransitions(maps.providedMap, states);
    states = addAppliedTooLongTransitions(maps.appliedTooLongMap, states);
    states = addStoppedTooSoonTransitions(maps.stoppedTooSoonMap, states);
    return states;
}

/**
 * Adds transitions to the {@code states} such that the ltl Formulas in {@code notProvidedMap} are respected.
 * @param notProvidedMap The LTL formulas with UCA type not-provided/too-late for each control action.
 * @param states The states of the SBM.
 */
function addNotProvidedTransitions(notProvidedMap: Map<string, LTLFormula[]>, states: State[]): void {
    for (const controlAction of notProvidedMap.keys()) {
        const controlActionStateIndex = states.findIndex(state => state.name === controlAction);
        const controlActionState = states[controlActionStateIndex];
        states.forEach((state, index) => {
            if (index !== controlActionStateIndex) {
                // transition from all other states to the controlaction state
                notProvidedMap.get(controlAction)?.forEach(ltlFormula => {
                    // prevent dublicates
                    const sameTransition = state.transitions.find(transition => transition.target === controlActionState.name && transition.trigger === ltlFormula.contextVariables);
                    if (sameTransition === undefined) {
                        // add transition
                        const transition = {
                            target: controlActionState.name,
                            trigger: ltlFormula.contextVariables
                        };
                        state.transitions.push(transition);
                    }
                });
            }
        });
    }
}

/**
 * Adds transitions to the {@code states} such that the ltl Formulas in {@code providedMap} are respected.
 * @param providedMap The LTL formulas with UCA type provided for each control action.
 * @param states The states of the SBM.
 */
function addProvidedTransitions(providedMap: Map<string, LTLFormula[]>, states: State[]): void {
    for (const controlAction of providedMap.keys()) {
        const controlActionState = states.find(state => state.name === controlAction);
        if (controlActionState) {
            providedMap.get(controlAction)?.forEach(ltlFormula => {
                // only add a transition if there not already exists one with the same trigger
                const sameTrigger = controlActionState.transitions.find(transition => transition.trigger === ltlFormula.contextVariables);
                if (sameTrigger === undefined) {
                    // transition from controlaction state to the empty state
                    const transition = {
                        target: EMPTY_STATE_NAME,
                        trigger: ltlFormula.contextVariables
                    };
                    controlActionState.transitions.push(transition);
                }
            });
        }
    }
}


/**
 * Adds transitions to the {@code states} such that the ltl Formulas in {@code appliedTooLongMap} are respected.
 * @param appliedTooLongMap The LTL formulas with UCA type applied-too-long for each control action.
 * @param states The states of the SBM.
 */
function addAppliedTooLongTransitions(appliedTooLongMap: Map<string, LTLFormula[]>, states: State[]): State[] {
    for (const controlAction of appliedTooLongMap.keys()) {
        const controlActionState = states.find(state => state.name === controlAction);
        if (controlActionState) {
            appliedTooLongMap.get(controlAction)?.forEach(ltlFormula => {
                const dublicateState = createDublicateState(states, controlActionState, ltlFormula);
                states.push(dublicateState);
                // transition to initial state
                // TODO: check existing transitions to decide whether this transition is needed or already covered
                dublicateState.transitions.push({ target: EMPTY_STATE_NAME, trigger: `!(${ltlFormula.contextVariables})` });
            });
        }
    }
    return states;
}

function copyOutgoingTransitions(originalState: State): Transition[] {
    // copy outgoing transitions from original state
    // transitions that are going to other dublicate states should not be copied!
    const dubclicateTransitions: Transition[] = [];
    originalState.transitions.forEach(transition => {
        if (!transition.target.startsWith(originalState.name + "_")) {
            dubclicateTransitions.push({ target: transition.target, trigger: transition.trigger, effect: transition.effect });
        }
    });
    return dubclicateTransitions;
}

function copyAndAdjustIncomingTransitions(states: State[], controlActionState: State, dublicateState: State, ltlFormula: LTLFormula): void {
    states.forEach(state => {
        const transitionsToDublicate: Transition[] = [];
        const transitionsToCA = state.transitions.filter(transition => transition.target === controlActionState.name);
        transitionsToCA.forEach(transition => {
            // transition to dublicate state
            transitionsToDublicate.push({ target: dublicateState.name, trigger: transition.trigger + ` && (${ltlFormula.contextVariables})`, effect: transition.effect });
            // adjust trigger of original transition
            transition.trigger = transition.trigger + ` && !(${ltlFormula.contextVariables})`;
        });
        state.transitions = state.transitions.concat(transitionsToDublicate);
    });
}

/**
 * Adds transitions to the {@code states} such that the ltl Formulas in {@code stoppedTooSoonMap} are respected.
 * @param stoppedTooSoonMap The LTL formulas with UCA type stopped-too-soon for each control action.
 * @param states The states of the SBM.
 */
function addStoppedTooSoonTransitions(stoppedTooSoonMap: Map<string, LTLFormula[]>, states: State[]): State[] {
    for (const controlAction of stoppedTooSoonMap.keys()) {
        const controlActionState = states.find(state => state.name === controlAction);
        if (controlActionState) {
            // TODO: add transitions from dublicate states, created because of stopped-too-soon, to all dublicate states
            stoppedTooSoonMap.get(controlAction)?.forEach(ltlFormula => {
                // there may be already a dublicate state created because of applied-too-long
                let dublicateState = states.find(state => state.name === getStateName(controlAction, ltlFormula));
                // create dublicate state if it does not exist
                if (dublicateState === undefined) {
                    dublicateState = createDublicateState(states, controlActionState, ltlFormula);
                    states.push(dublicateState);
                }
                // adjust trigger of outgoing transitions
                dublicateState.transitions.forEach(transition => {
                    transition.trigger = transition.trigger + ` && !(${ltlFormula.contextVariables})`;
                });
            });
        }
    }
    return states;
}

function createDublicateState(states: State[], controlActionState: State, ltlFormula: LTLFormula): State {
    // create state
    const dublicateState: State = { name: getStateName(controlActionState.name, ltlFormula), controlAction: controlActionState.controlAction, transitions: [] };
    // create incoming transitions for the dublicate state
    copyAndAdjustIncomingTransitions(states, controlActionState, dublicateState, ltlFormula);
    // copy outgoing transitions from controlaction state
    dublicateState.transitions = copyOutgoingTransitions(controlActionState);
    // transition from controlaction state to the dublicate state
    controlActionState?.transitions.push({ target: dublicateState.name, trigger: ltlFormula.contextVariables });
    return dublicateState;
}

function getStateName(controlAction: string, ltlFormula: LTLFormula): string {
    return controlAction + "_" + ltlFormula.contextVariables;
}
