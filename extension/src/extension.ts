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
import { TemplateWebview } from './template-webview';

let extension: StpaLspVscodeExtension;

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Activating STPA extension');
    extension = new StpaLspVscodeExtension(context);

    const provider: vscode.WebviewViewProvider = {
        resolveWebviewView: function (webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
            const tWebview = new TemplateWebview(
                "templates",
                extension,
                [
                    extension.getExtensionFileUri('pack')
                ],
                extension.getExtensionFileUri('pack', 'tempWebview.js'),
            );
            tWebview.webview = webviewView.webview;
            tWebview.webview.options = {
                enableScripts: true
            };
            const title = tWebview.createTitle();
            webviewView.title = title;
            tWebview.initializeWebview(webviewView.webview, title);
            tWebview.connect();
            extension.languageClient.onNotification('templates/add', (msg) => tWebview.sendToWebview(msg));
        }
    };
    vscode.window.registerWebviewViewProvider("stpa-templates", provider);
}

export function deactivate(): Thenable<void> {
    if (!extension)
        return Promise.resolve();
    return extension.deactivateLanguageClient();
}

