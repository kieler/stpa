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
import { SprottyDiagramIdentifier } from 'sprotty-vscode-protocol';
import { SprottyWebview } from './sprotty-webview';
export declare abstract class SprottyVscodeExtension {
    readonly extensionPrefix: string;
    readonly context: vscode.ExtensionContext;
    protected readonly webviewMap: Map<string, SprottyWebview>;
    protected singleton?: SprottyWebview;
    constructor(extensionPrefix: string, context: vscode.ExtensionContext);
    protected registerCommands(): void;
    protected findActiveWebview(): SprottyWebview | undefined;
    didCloseWebview(identifier: SprottyDiagramIdentifier): void;
    protected getKey(identifier: SprottyDiagramIdentifier): string;
    protected abstract createWebView(diagramIdentifier: SprottyDiagramIdentifier): SprottyWebview;
    protected createDiagramIdentifier(commandArgs: any[]): Promise<SprottyDiagramIdentifier | undefined>;
    protected abstract getDiagramType(commandArgs: any[]): Promise<string | undefined> | string | undefined;
    getDiagramTypeForUri(uri: vscode.Uri): Promise<string | undefined> | string | undefined;
    protected getURI(commandArgs: any[]): Promise<vscode.Uri | undefined>;
    getExtensionFileUri(...segments: string[]): vscode.Uri;
}
export declare function serializeUri(uri: vscode.Uri): string;
//# sourceMappingURL=sprotty-vscode-extension.d.ts.map