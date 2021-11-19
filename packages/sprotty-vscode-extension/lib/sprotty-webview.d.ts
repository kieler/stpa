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
import { Action, ActionMessage, SprottyDiagramIdentifier } from 'sprotty-vscode-protocol';
import * as vscode from 'vscode';
import { ActionHandler } from './action-handler';
import { SprottyVscodeExtension } from './sprotty-vscode-extension';
import { ResponseMessage } from 'vscode-jsonrpc/lib/common/messages';
export interface SprottyWebviewOptions {
    extension: SprottyVscodeExtension;
    identifier: SprottyDiagramIdentifier;
    localResourceRoots: vscode.Uri[];
    scriptUri: vscode.Uri;
    singleton?: boolean;
}
export declare class SprottyWebview {
    protected options: SprottyWebviewOptions;
    static viewCount: number;
    readonly extension: SprottyVscodeExtension;
    readonly diagramIdentifier: SprottyDiagramIdentifier;
    readonly localResourceRoots: vscode.Uri[];
    readonly scriptUri: vscode.Uri;
    readonly diagramPanel: vscode.WebviewPanel;
    readonly actionHandlers: Map<string, ActionHandler>;
    protected messageQueue: (ActionMessage | SprottyDiagramIdentifier | ResponseMessage)[];
    protected disposables: vscode.Disposable[];
    private resolveWebviewReady;
    private readonly webviewReady;
    constructor(options: SprottyWebviewOptions);
    get singleton(): boolean;
    protected ready(): Promise<void>;
    protected createTitle(): string;
    protected createWebviewPanel(): vscode.WebviewPanel;
    protected initializeWebview(webview: vscode.Webview, title?: string): void;
    protected connect(): Promise<void>;
    reloadContent(newId: SprottyDiagramIdentifier): Promise<void>;
    protected setWebviewActiveContext(isActive: boolean): void;
    protected sendDiagramIdentifier(): Promise<void>;
    /**
     * @return true if the message should be propagated, e.g. to a language server
     */
    protected receiveFromWebview(message: any): Thenable<boolean>;
    protected sendToWebview(message: any): void;
    dispatch(action: Action): void;
    accept(action: Action): Thenable<boolean>;
    addActionHandler(actionHandlerConstructor: new (webview: SprottyWebview) => ActionHandler): void;
}
//# sourceMappingURL=sprotty-webview.d.ts.map