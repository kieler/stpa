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
import { LTLFormula, State, Variable } from "./utils";

export function createSCChartText(controllerName: string, states: State[], variables: Variable[], ltlFormulas: LTLFormula[], controlActions: string[]): string {
    let result = "";
    ltlFormulas.forEach(LTLFormula => result += createLTLAnnotation(LTLFormula));
    result += `scchart ${controllerName} {\n\n`;
    result += createEnum(controllerName, controlActions);
    // TODO: AssumeRange annotation for variables?
    result += createVariables(variables);
    result += createStates(states);
    result += "}";
    return result;
}

function createLTLAnnotation(ltlFormula: LTLFormula): string {
    return `@LTL "${ltlFormula.formula}", "${ltlFormula.description}", "${ltlFormula.ucaId}" \n`;
}

function createEnum(name: string, values: string[]): string {
    let enumDecl = `enum ${name} {`;
    values.forEach((controlAction, index) => {
        enumDecl += controlAction;
        if (index < values.length - 1) { enumDecl += ", "; }
    });
    enumDecl += "}\n";
    enumDecl += `ref ${name} controlAction\n`;
    return enumDecl;
}

function createVariables(variables: Variable[]): string {
    let variableDecl = "";
    variables.forEach(variable => {
        variableDecl += `${variable.type} ${variable.name}\n`;
    });
    return variableDecl;
}

function createStates(states: State[]): string {
    // TODO: "Initial" is missing and control actions
    let stateDecl = "";
    states.forEach(state => {
        stateDecl += `state ${state.name} {\n`;

        stateDecl += "}\n";
        state.transitions.forEach(transition => {
            if (transition.trigger) {
                stateDecl += `if ${transition.trigger} `;
            }
            if (transition.effect) {
                stateDecl += `do ${transition.effect} `;
            }
            stateDecl += `go to ${transition.target}\n`;
        });
    });
    return stateDecl;
}

export async function createSCChartFile(uri: string, text: string): Promise<void> {
    // TODO: checking for existing file is not working. Document is always undefined
    let doc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === vscode.Uri.parse(uri).toString());
    const edit = new vscode.WorkspaceEdit();
    // if (doc !== undefined) {
    //     const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(doc.lineCount, 0));
    //     edit.replace(vscode.Uri.parse(uri), range, text);
    // } else {
    edit.createFile(vscode.Uri.parse(uri));
    const pos = new vscode.Position(0, 0);
    edit.insert(vscode.Uri.parse(uri), pos, text);
    // }
    // Apply the edit. Report possible failures.
    const edited = await vscode.workspace.applyEdit(edit);
    if (!edited) {
        console.error("Workspace edit could not be applied!");
        return;
    }
    // save the edit
    if (doc === undefined) {
        doc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === vscode.Uri.parse(uri).toString());
    }
    await doc?.save();
}

