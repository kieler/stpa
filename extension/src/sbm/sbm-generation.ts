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

export function createSBMs(controlActionsMap: Record<string, string[]>, formulaMap: Record<string, LTLFormula[]>): void {
    Object.keys(controlActionsMap).forEach(controller => createControllerSBM(controller, controlActionsMap[controller], formulaMap[controller]));
}

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
    // determine variables for scchart
    const variables = collectVariables(ltlFormulas);
    // create the scchart
    const scchartText = createSCChartText(controllerName, states, variables, ltlFormulas, controlActions);
    createSCChartFile(uri.path, scchartText);
}

function collectVariables(ltlFormulas: LTLFormula[]): Variable[] {
    const variableNames = new Set<string>;
    const variables: Variable[] = [];
    ltlFormulas.forEach(ltlFormula => {
        const splits = ltlFormula.contextVariables.split("&&");
        splits.forEach(split => {
            const operands = split.split(/>=|<=|>|<|==|!=/);
            if (operands.length === 1) {
                // is a boolean
                let varName = "";
                if (operands[0].charAt(0) === '!') {
                    varName = operands[0].substring(1);
                } else {
                    varName = operands[0];
                }
                if (!variableNames.has(varName)) {
                    variableNames.add(varName);
                    variables.push({ name: varName, type: "bool" });
                }
            } else {
                if (!variableNames.has(operands[0]) && checkOperand(operands[0])) {
                    variableNames.add(operands[0]);
                    variables.push({ name: operands[0], type: "int" });
                }
                if (!variableNames.has(operands[1]) && checkOperand(operands[1])) {
                    variableNames.add(operands[1]);
                    variables.push({ name: operands[1], type: "int" });
                }
            }
        });
    });
    return variables;
}

function checkOperand(operand: string): boolean {
    return isNaN(parseInt(operand));
}

function getControlActionFromLTL(ltlFormula: LTLFormula): string {
    // Calculation based on the assumption the the control action is stated first in the description and has the form <controller.action>
    const startIndex = ltlFormula.description.indexOf(".");
    const endIndex = ltlFormula.description.indexOf(" ");
    const action = ltlFormula.description.substring(startIndex + 1, endIndex);
    return action;
}

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
function createStatesForActions(controlActions: string[]): State[] {
    const states: State[] = [];
    controlActions.forEach(controlAction => {
        const state: State = {
            name: controlAction.substring(controlAction.indexOf(".") + 1),
            controlAction: controlAction,
            transitions: []
        };
        states.push(state);
    });
    states.push({
        name: EMPTY_STATE_NAME,
        controlAction: "",
        transitions: []
    });
    return states;
}
function addTransitions(states: State[], controlAction: string, ltlFormulas: LTLFormula[]): void {
    const controlActionStateIndex = states.findIndex(state => state.name === controlAction);
    const controlActionState = states[controlActionStateIndex];
    ltlFormulas.forEach(ltlFormula => {
        switch (ltlFormula.type) {
            case UCA_TYPE.PROVIDED:
                const transition = {
                    target: EMPTY_STATE_NAME,
                    trigger: ltlFormula.contextVariables
                };
                const newTransitions: Transition[] = [transition];
                newTransitions.push(... controlActionState.transitions);
                controlActionState.transitions = newTransitions;
                break;
            case UCA_TYPE.NOT_PROVIDED:
                states.forEach((state, index) => {
                    if (index !== controlActionStateIndex) {
                        const transition = {
                            target: controlActionState.name,
                            trigger: ltlFormula.contextVariables
                        };
                        state.transitions.push(transition);
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

