/********************************************************************************
 * Copyright (c) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import * as vscode from 'vscode';
import { ActionMessage } from 'sprotty-protocol';
import { StpaLspVscodeExtension } from './language-extension';
import { acceptMessageType } from 'sprotty-vscode/lib/lsp';

export class TemplateWebview {

    static viewCount = 0;

    readonly extension: StpaLspVscodeExtension;
    readonly identifier: string;
    readonly localResourceRoots: vscode.Uri[];
    readonly scriptUri: vscode.Uri;
    webview: vscode.Webview;

    protected disposables: vscode.Disposable[] = [];

    private resolveWebviewReady: () => void;
    private readonly webviewReady = new Promise<void>((resolve) => this.resolveWebviewReady = resolve);

    constructor(identifier: string, extension: StpaLspVscodeExtension, localResourceRoots: vscode.Uri[], scriptUri: vscode.Uri) {
        this.extension = extension;
        this.identifier = identifier;
        this.localResourceRoots = localResourceRoots;
        this.scriptUri = scriptUri;
    }

    ready(): Promise<void> {
        return this.webviewReady;
    }

    createTitle(): string {
        return this.identifier;
    }

    async initializeWebview(webview: vscode.Webview, title?: string) {
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

    async connect() {
        this.disposables.push(this.webview.onDidReceiveMessage(message => this.receiveFromWebview(message)));
        /* this.disposables.push(vscode.window.onDidChangeActiveTextEditor(async editor => {
            if (editor) {
                //TODO: templates may be needed to be updated
            }
        })); */
        await this.ready();
    }

    protected async sendDiagramIdentifier() {
        await this.ready();
        this.sendToWebview({ identifier: this.identifier });
    }

    /**
     * @return true if the message should be propagated, e.g. to a language server
     */
    protected async receiveFromWebview(message: any) {
        console.log("Received from webview");
        if (message.readyMessage) {
            this.resolveWebviewReady();
            this.sendDiagramIdentifier();

            // TODO: guarantee that sprotty webview exist
            if (this.extension.clientId) {
                const mes: ActionMessage = {
                    clientId: this.extension.clientId,
                    action: {
                        kind: "templateWebviewRdy"
                    }
                };
                this.extension.languageClient.sendNotification(acceptMessageType, mes);
            }
        } else if (message.action && this.extension.clientId) {
            const mes: ActionMessage = {
                clientId: this.extension.clientId,
                action: message.action
            };
            this.extension.languageClient.sendNotification(acceptMessageType, mes);
        }
    }

    sendToWebview(message: any) {
        this.webview.postMessage(message);
    }

}