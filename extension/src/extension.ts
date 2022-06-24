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
import { TemplateWebview } from './template-webview';

let extension: SprottyLspVscodeExtension;

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Activating STPA extension');
    extension = new StpaLspVscodeExtension(context);

    const provider: vscode.WebviewViewProvider = {
        resolveWebviewView: function (webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {

            const tWebview = new TemplateWebview(
                "templates",
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

            /* webviewView.webview.html =`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cat Coding</title>
            </head>
            <body>
                <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
            </body>
            </html>` */
        }
    };
    vscode.window.registerWebviewViewProvider("stpa-templates", provider);
}

export function deactivate(): Thenable<void> {
    if (!extension)
        return Promise.resolve();
    return extension.deactivateLanguageClient();
}


import { SGraph, SNode, SEdge, SLabel } from 'sprotty-protocol';
import { SModelElement } from 'sprotty';

export function getLocalSource(): SGraph {
    const graph: SGraph = {
        type: 'graph',
        id: 'root',
        children: [
            {
                type: 'node',
                id: 'task01',
                children: [
                    { text: "n1", id: "label1", type: "label" } as SLabel
                ],
                layout: "stack"
            } as SNode,
            {
                type: 'node',
                id: 'task02',
                children: [
                    { text: "n2", id: "label2", type: "label" } as SLabel
                ],
                layout: "stack"
            } as SNode,
            {
                type: 'node',
                id: 'task03',
                children: [
                    { text: "n3", id: "label3", type: "label" } as SLabel
                ],
                layout: "stack"
            } as SNode,
            {
                type: 'edge',
                id: 'edge01',
                sourceId: 'task01',
                targetId: 'task02'
            } as SEdge,
            {
                type: 'edge',
                id: 'edge02',
                sourceId: 'task02',
                targetId: 'task03'
            } as SEdge
        ] as SModelElement[]
    };

    return graph;
}