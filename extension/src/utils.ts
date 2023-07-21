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