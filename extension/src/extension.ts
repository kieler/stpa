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
import { SprottyLspVscodeExtension } from 'sprotty-vscode/lib/lsp';

let extension: SprottyLspVscodeExtension;

export function activate(context: vscode.ExtensionContext): void {
    vscode.window.showInformationMessage('Activating STPA extension');
    extension = new StpaLspVscodeExtension(context);
}

export function deactivate(): Thenable<void> {
    if (!extension)
       return Promise.resolve();
    return extension.deactivateLanguageClient();
}