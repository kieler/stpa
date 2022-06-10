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

import { Action, ActionMessage, applyBounds, ComputedBoundsAction, isActionMessage, RequestBoundsAction, SGraph, RequestModelAction, UpdateModelAction } from 'sprotty-protocol';
import { isDiagramIdentifier, isWebviewReadyMessage, SprottyDiagramIdentifier } from 'sprotty-vscode-protocol';
import * as vscode from 'vscode';

import { ActionHandler } from 'sprotty-vscode/lib/action-handler';
import { SprottyVscodeExtension, serializeUri } from 'sprotty-vscode/lib/sprotty-vscode-extension';
import { isResponseMessage, ResponseMessage } from 'vscode-jsonrpc/lib/common/messages';
import { SprottyWebview, SprottyWebviewOptions } from 'sprotty-vscode/lib/sprotty-webview';
import { getLocalSource } from './extension';
import ElkConstructor from 'elkjs/lib/elk.bundled';
import { ElkLayoutEngine, DefaultElementFilter, DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';

export class TemplateWebview {

    static viewCount = 0;

    readonly extension: SprottyVscodeExtension;
    readonly diagramIdentifier: SprottyDiagramIdentifier;
    readonly localResourceRoots: vscode.Uri[];
    readonly scriptUri: vscode.Uri;
    webview: vscode.Webview;
    readonly actionHandlers = new Map<string, ActionHandler>();

    protected messageQueue: (ActionMessage | SprottyDiagramIdentifier | ResponseMessage)[] = [];
    protected disposables: vscode.Disposable[] = [];

    private resolveWebviewReady: () => void;
    private readonly webviewReady = new Promise<void>((resolve) => this.resolveWebviewReady = resolve);

    private root: SGraph | undefined;
    private layoutEngine: ElkLayoutEngine;

    constructor(protected options: SprottyWebviewOptions) {
        this.extension = options.extension;
        this.diagramIdentifier = options.identifier;
        this.localResourceRoots = options.localResourceRoots;
        this.scriptUri = options.scriptUri;

        const factory = () => new ElkConstructor({ algorithms: ['layered'] });
        this.layoutEngine = new ElkLayoutEngine(factory, new DefaultElementFilter, new DefaultLayoutConfigurator);
    }

    get singleton(): boolean {
        return !!this.options.singleton;
    }

    ready(): Promise<void> {
        return this.webviewReady;
    }

    createTitle(): string {
        if (this.diagramIdentifier.uri)
            return this.diagramIdentifier.uri.substring(this.diagramIdentifier.uri.lastIndexOf('/') + 1);
        if (this.diagramIdentifier.diagramType)
            return this.diagramIdentifier.diagramType;
        else
            return 'Diagram';
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
                    <div id="${this.diagramIdentifier.clientId}_container" style="height: 100%;"></div>
                    <script src="${webview.asWebviewUri(this.scriptUri).toString()}"></script>
                </body>
            </html>`;
    }

    async connect() {
        this.disposables.push(this.webview.onDidReceiveMessage(message => this.receiveFromWebview(message)));
        if (this.singleton) {
            this.disposables.push(vscode.window.onDidChangeActiveTextEditor(async editor => {
                if (editor) {
                    const uri = editor.document.uri;
                    const diagramType = await this.extension.getDiagramTypeForUri(uri);
                    if (diagramType) {
                        this.reloadContent({
                            diagramType,
                            uri: serializeUri(uri),
                            clientId: this.diagramIdentifier.clientId
                        });
                    }
                }
            }));
        }
        await this.ready();
    }

    async reloadContent(newId: SprottyDiagramIdentifier): Promise<void> {
        if (newId.diagramType !== this.diagramIdentifier.diagramType || newId.uri !== this.diagramIdentifier.uri) {
            this.diagramIdentifier.diagramType = newId.diagramType;
            this.diagramIdentifier.uri = newId.uri;
            this.sendDiagramIdentifier();
        }
    }

    protected setWebviewActiveContext(isActive: boolean) {
        vscode.commands.executeCommand('setContext', this.diagramIdentifier.diagramType + '-focused', isActive);
    }

    protected async sendDiagramIdentifier() {
        await this.ready();
        this.sendToWebview(this.diagramIdentifier);
    }

    /**
     * @return true if the message should be propagated, e.g. to a language server
     */
    protected receiveFromWebview(message: any): Thenable<boolean> {
        if (isActionMessage(message))
            return this.accept(message.action);
        else if (isWebviewReadyMessage(message)) {
            this.resolveWebviewReady();
            this.sendDiagramIdentifier();
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    }

    protected sendToWebview(message: any) {
        if (isActionMessage(message) || isDiagramIdentifier(message) || isResponseMessage(message)) {
            if (isActionMessage(message)) {
                const actionHandler = this.actionHandlers.get(message.action.kind);
                if (actionHandler && !actionHandler.handleAction(message.action))
                    return;
            }
            this.webview.postMessage(message);
        }
    }

    dispatch(action: Action) {
        this.sendToWebview({
            clientId: this.diagramIdentifier.clientId,
            action
        });
    }

    accept(action: Action): Thenable<boolean> {
        const actionHandler = this.actionHandlers.get(action.kind);
        if (actionHandler)
            return actionHandler.handleAction(action);
        if (action.kind === RequestModelAction.KIND) {
            this.handleRequestModel(action as RequestModelAction);
        } else if (action.kind === ComputedBoundsAction.KIND) {
            this.handleComputedBounds(action as ComputedBoundsAction);
        }
        return Promise.resolve(true);
    }

    handleRequestModel(action: RequestModelAction): void {
        this.root = getLocalSource();
        /* const requestId = (action as RequestModelAction).requestId;
        const response = SetModelAction.create(root, requestId);
        this.dispatch(response); */

        this.dispatch({
            kind: RequestBoundsAction.KIND,
            newRoot: this.root
        } as RequestBoundsAction);
    }

    async handleComputedBounds(action: ComputedBoundsAction) {
        if (this.root) {
            // bounds for labels and nodes
            applyBounds(this.root, action);
            // layout the graph
            this.root = await this.layoutEngine.layout(this.root);
            // send graph to webview
            this.dispatch({
                kind: UpdateModelAction.KIND,
                newRoot: this.root,
                animate: true
            } as UpdateModelAction);
        }
    }

    addActionHandler(actionHandlerConstructor: new (webview: SprottyWebview) => ActionHandler) {
        const actionHandler = new actionHandlerConstructor(this as any as SprottyWebview);
        this.actionHandlers.set(actionHandler.kind, actionHandler);
    }
}