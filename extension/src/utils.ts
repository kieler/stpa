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

/**
 * Applies text edits to the document.
 * @param edits The edits to apply.
 * @param uri The uri of the document that should be edited.
 */
export async function applyTextEdits(edits: vscode.TextEdit[], uri: string): Promise<void> {
    // create a workspace edit
    const workSpaceEdit = new vscode.WorkspaceEdit();
    workSpaceEdit.set(vscode.Uri.parse(uri), edits);
    // Apply the edit. Report possible failures.
    const edited = await vscode.workspace.applyEdit(workSpaceEdit);
    if (!edited) {
        console.error("Workspace edit could not be applied!");
        return;
    }
}

/**
 * Collects the STPA options of the configuration settings and returns them as a list of their ids and values.
 * @param configuration The workspace configuration options.
 * @returns A list of the workspace options, whereby a option is represented with an id and its value.
 */
export function collectOptions(configuration: vscode.WorkspaceConfiguration): { id: string, value: any; }[] {
    const values: { id: string, value: any; }[] = [];
    values.push({ id: "checkResponsibilitiesForConstraints", value: configuration.get("checkResponsibilitiesForConstraints") });
    values.push({ id: "checkConstraintsForUCAs", value: configuration.get("checkConstraintsForUCAs") });
    values.push({ id: "checkScenariosForUCAs", value: configuration.get("checkScenariosForUCAs") });
    values.push({ id: "checkSafetyRequirementsForUCAs", value: configuration.get("checkSafetyRequirementsForUCAs") });
    return values;
}

/**
 * Creates a quickpick containing the values "true" and "false". The selected value is set for the 
 * configuration option determined by {@code id}.
 * @param id The id of the configuration option that should be set.
 */
export function createQuickPickForWorkspaceOptions(id: string): void {
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = [{ label: "true" }, { label: "false" }];
    quickPick.onDidChangeSelection((selection) => {
        if (selection[0]?.label === "true") {
            vscode.workspace.getConfiguration('pasta').update(id, true);
        } else {
            vscode.workspace.getConfiguration('pasta').update(id, false);
        }
        quickPick.hide();
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
}