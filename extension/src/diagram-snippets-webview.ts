/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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
import { ActionMessage } from 'sprotty-protocol';
import { StpaLspVscodeExtension } from './language-extension';
import { acceptMessageType } from 'sprotty-vscode/lib/lsp';
import { SendDefaultSnippetsAction } from './actions';

export class DiagramSnippetWebview {

    static viewCount = 0;

    readonly extension: StpaLspVscodeExtension;
    readonly identifier: string;
    readonly scriptUri: vscode.Uri;
    webview: vscode.Webview;

    protected disposables: vscode.Disposable[] = [];

    private resolveWebviewReady: () => void;
    private readonly webviewReady = new Promise<void>((resolve) => this.resolveWebviewReady = resolve);

    constructor(identifier: string, extension: StpaLspVscodeExtension, scriptUri: vscode.Uri) {
        this.extension = extension;
        this.identifier = identifier;
        this.scriptUri = scriptUri;
    }

    ready(): Promise<void> {
        return this.webviewReady;
    }

    createTitle(): string {
        return this.identifier;
    }

    async initializeWebview(webview: vscode.Webview, title?: string): Promise<void> {
        webview.html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, height=device-height">
                    <title>${title}</title>
                    <link
                        rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css"
                        integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/"
                        crossorigin="anonymous">
                </head>
                <body>
                    <div id="${this.identifier}_container" style="height: 100%;"></div>
                    <script> const vscode = acquireVsCodeApi();</script>
                    <script src="${webview.asWebviewUri(this.scriptUri).toString()}"></script>
                </body>
            </html>`;
    }

    /**
     * Registers listeners.
     */
    async connect(): Promise<void> {
        this.disposables.push(this.webview.onDidReceiveMessage(message => this.receiveFromWebview(message)));
        /* this.disposables.push(vscode.window.onDidChangeActiveTextEditor(async editor => {
            if (editor) {
                //TODO: snippets may be needed to be updated
            }
        })); */
        await this.ready();
    }

    /**
     * Sends identifier to the webview.
     */
    protected async sendDiagramIdentifier(): Promise<void> {
        await this.ready();
        this.sendToWebview({ identifier: this.identifier });
    }

    /**
     * Handles messages from the webview.
     * @param message The message received from the webview.
     */
    protected async receiveFromWebview(message: any): Promise<void> {
        if (message.readyMessage) {
            this.resolveWebviewReady();
            this.sendDiagramIdentifier();

            // TODO: guarantee that sprotty webview exist
            if (this.extension.clientId) {
                // send the snippets saved in the config file to the language server, 
                // which will send the rendered snippets back to the diagram snippets webview
                const snippets = vscode.workspace.getConfiguration('pasta.stpa').get('snippets');
                const action = { kind: SendDefaultSnippetsAction.KIND, snippets: snippets } as SendDefaultSnippetsAction;
                const sendSnippetsActionMessage: ActionMessage = {
                    clientId: this.extension.clientId,
                    action: action
                };
                this.extension.languageClient.sendNotification(acceptMessageType, sendSnippetsActionMessage);
            }
        } else if (message.action && this.extension.clientId) {
            // forward the action to the language server
            const actionMessage: ActionMessage = {
                clientId: this.extension.clientId,
                action: message.action
            };
            this.extension.languageClient.sendNotification(acceptMessageType, actionMessage);
        }
    }

    sendToWebview(message: any): void {
        this.webview.postMessage(message);
    }

}