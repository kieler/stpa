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

import * as vscode from "vscode";

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
            vscode.workspace.getConfiguration("pasta").update(id, true);
        } else {
            vscode.workspace.getConfiguration("pasta").update(id, false);
        }
        quickPick.hide();
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
}

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
export function collectOptions(configuration: vscode.WorkspaceConfiguration): { id: string; value: any }[] {
    const values: { id: string; value: any }[] = [];
    values.push({
        id: "checkResponsibilitiesForConstraints",
        value: configuration.get("checkResponsibilitiesForConstraints"),
    });
    values.push({ id: "checkConstraintsForUCAs", value: configuration.get("checkConstraintsForUCAs") });
    values.push({ id: "checkScenariosForUCAs", value: configuration.get("checkScenariosForUCAs") });
    values.push({ id: "checkSafetyRequirementsForUCAs", value: configuration.get("checkSafetyRequirementsForUCAs") });
    return values;
}

/**
 * Creates a file with the given {@code uri} containing the {@code text}.
 * @param uri The uri of the file to create.
 * @param text The content of the file.
 */
export async function createFile(uri: string, text: string): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    // create the file
    edit.createFile(vscode.Uri.parse(uri), { overwrite: true });
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
    const doc = vscode.workspace.textDocuments.find((doc) => doc.uri.toString() === vscode.Uri.parse(uri).toString());
    const saved = await doc?.save();
    if (!saved) {
        console.error(`TextDocument ${doc?.uri} could not be saved!`);
        return;
    }
}

export class StpaResult {
    title: string;
    losses: StpaComponent[] = [];
    hazards: StpaComponent[] = [];
    systemLevelConstraints: StpaComponent[] = [];
    // sorted by system components
    responsibilities: Record<string, StpaComponent[]> = {};
    // sorted first by control action, then by uca type
    ucas: Record<string, Record<string, StpaComponent[]>> = {};
    // sorted by control action
    controllerConstraints: Record<string, StpaComponent[]> = {};
    // sorted by ucas
    ucaScenarios: Record<string, StpaComponent[]> = {};
    scenarios: StpaComponent[] = [];
    safetyCons: StpaComponent[] = [];
}

export class StpaComponent {
    id: string;
    description: string;
    references?: string;
    subComponents?: StpaComponent[];
}

/**
 * Provides the different UCA types.
 */
export class UCA_TYPE {
    static NOT_PROVIDED = "not-provided";
    static PROVIDED = "provided";
    static TOO_EARLY = "too-early";
    static TOO_LATE = "too-late";
    static APPLIED_TOO_LONG = "applied-too-long";
    static STOPPED_TOO_SOON = "stopped-too-soon";
    static WRONG_TIME = "wrong-time";
    static CONTINUOUS = "continuous-problem";
    static UNDEFINED = "undefined";
}
