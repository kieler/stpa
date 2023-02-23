/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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
import { StpaLspVscodeExtension } from './language-extension';
import { command } from './constants';

let extension: StpaLspVscodeExtension;

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Activating STPA extension');
    extension = new StpaLspVscodeExtension(context);
    // register commands that other extensions can use
    context.subscriptions.push(vscode.commands.registerCommand(
        command.getLTLFormula,
        async (uri: string) => {
            // generate and send back the LTLs based on the STPA UCAs
            await extension.lsReady
            const formulas: {formula: string, text: string, ucaId: string}[] = await extension.languageClient.sendRequest('modelChecking/generateLTL', uri);
            return formulas;
        }
    ));
}

export function deactivate(): Thenable<void> {
    if (!extension)
        return Promise.resolve();
    return extension.deactivateLanguageClient();
}