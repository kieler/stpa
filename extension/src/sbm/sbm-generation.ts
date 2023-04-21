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

import { LTLFormula, State } from "./utils";
import { createSCChartText, createSCChartFile } from "./scchart-creation";

export function createSBMs(controlActionsMap: Record<string, string[]>, formulaMap: Record<string, LTLFormula[]>): void {
    Object.keys(controlActionsMap).forEach(controller => createControllerSBM(controlActionsMap[controller], formulaMap[controller]));
}

function createControllerSBM(controlActions: string[], ltlFormulas: LTLFormula[]): void {
    const formulaMap = groupFormulasByAction(ltlFormulas);
    const states = createStatesForActions(controlActions);
    for (const controlAction of formulaMap.keys()) {
        // if formulas is undefined, no formulas exist for the control action
        const formulas = formulaMap.get(controlAction);
        if (formulas !== undefined) {
            addTransitions(states, controlAction, formulas);
        }
    }
    const scchartText = createSCChartText(states, ltlFormulas, controlActions);
    //TODO: what should be the file name?
    createSCChartFile("FileName", scchartText);
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
        const state: State = { name: controlAction.substring(controlAction.indexOf(".") + 1), transitions: [], controlAction: controlAction };
        states.push(state);
    });
    return states;
}
function addTransitions(states: State[], controlAction: string, ltlFormulas: LTLFormula[]): void {
    throw new Error("Function not implemented.");
}

