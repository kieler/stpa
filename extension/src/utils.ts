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

/**
 * Creates a file with the given {@code uri} containing the {@code text}.
 * @param uri The uri of the file to create.
 * @param text The content of the file.
 * @returns 
 */
export async function createFile(uri: string, text: string): Promise<void> {
    const edit = new vscode.WorkspaceEdit();

    // create the file
    edit.createFile(vscode.Uri.parse(uri), {overwrite: true});
    // insert the content
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
    const doc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === vscode.Uri.parse(uri).toString());
    const saved = await doc?.save();
    if (!saved) {
        console.error(`TextDocument ${doc?.uri} could not be saved!`);
        return;
    }
}

