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

import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { LspLabelEditActionHandler, WorkspaceEditActionHandler, SprottyLspEditVscodeExtension } from "sprotty-vscode/lib/lsp/editing";
import { SprottyDiagramIdentifier } from 'sprotty-vscode/lib/lsp';
import { SprottyWebview } from 'sprotty-vscode/lib/sprotty-webview';
import { ActionMessage, JsonMap } from 'sprotty-protocol';
import { UpdateViewAction } from './actions';
import { ContextTablePanel } from './ContextTablePanel';
import { StpaFormattingEditProvider } from './stpa-formatter';
import { StpaLspWebview } from './wview';

export class StpaLspVscodeExtension extends SprottyLspEditVscodeExtension {

    protected contextTable: ContextTablePanel;

    constructor(context: vscode.ExtensionContext) {
        super('stpa', context);
        let sel: vscode.DocumentSelector = { scheme: 'file', language: 'stpa' };
        vscode.languages.registerDocumentFormattingEditProvider(sel, new StpaFormattingEditProvider());
    }

    protected registerCommands(): void {
        super.registerCommands();
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.contextTable.open', async (...commandArgs: any[]) => {
                this.createContextTable();
                await this.contextTable.ready();
                this.languageClient.sendNotification('contextTable/getData', (commandArgs[0] as vscode.Uri).toString());
            })
        );
    }

    protected getDiagramType(commandArgs: any[]): string | undefined {
        if (commandArgs.length === 0
            || commandArgs[0] instanceof vscode.Uri && commandArgs[0].path.endsWith('.stpa')) {
            return 'stpa-diagram';
        }
        return undefined;
    }

    createContextTable(): void {
        const tWebview = new ContextTablePanel(
            'Context-Table',
            [this.getExtensionFileUri('pack')],
            this.getExtensionFileUri('pack', 'context-table-panel.js')
        );
        this.contextTable = tWebview;

        //TODO: add interactivity?
        /* this.context.subscriptions.push(
            this.contextTable.cellClicked((cell: { rowId: string; columnId: string } | undefined) => {
                
            })
        )*/
    }

    createWebView(identifier: SprottyDiagramIdentifier): SprottyWebview {
        const webview = new StpaLspWebview({
            extension: this,
            identifier,
            localResourceRoots: [
                this.getExtensionFileUri('pack')
            ],
            scriptUri: this.getExtensionFileUri('pack', 'webview.js'),
            singleton: true // Change this to `true` to enable a singleton view
        });
        webview.addActionHandler(WorkspaceEditActionHandler);
        webview.addActionHandler(LspLabelEditActionHandler);

        this.singleton = webview;
        return webview;
    }

    protected activateLanguageClient(context: vscode.ExtensionContext): LanguageClient {
        const serverModule = context.asAbsolutePath(path.join('pack', 'language-server'));
        // The debug options for the server
        // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
        // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
        const debugOptions = { execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`] };

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
        };

        const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.stpa');
        context.subscriptions.push(fileSystemWatcher);

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: 'file', language: 'stpa' }],
            synchronize: {
                // Notify the server about file changes to files contained in the workspace
                fileEvents: fileSystemWatcher
            }
        };

        // Create the language client and start the client.
        const languageClient = new LanguageClient(
            'stpa',
            'stpa',
            serverOptions,
            clientOptions
        );

        // Start the client. This will also launch the server
        context.subscriptions.push(languageClient.start());
        // diagram is updated when file changes
        fileSystemWatcher.onDidChange((uri) => this.updateViews(languageClient, uri.toString()));

        languageClient.onReady().then(() => {
            languageClient.onNotification('contextTable/data', data => this.contextTable.setData(data));
        });
        return languageClient;
    }

    protected updateViews(languageClient: LanguageClient, uri: string) {
        if (this.contextTable) {
            languageClient.sendNotification('contextTable/getData', uri);
        }
        if (this.singleton) {
            const mes: ActionMessage = {
                clientId: this.singleton?.diagramIdentifier.clientId,
                action: {
                    kind: UpdateViewAction.KIND,
                    options: {
                        diagramType: this.singleton.diagramIdentifier.diagramType,
                        needsClientLayout: true,
                        needsServerLayout: true,
                        sourceUri: this.singleton.diagramIdentifier.uri
                    } as JsonMap
                } as UpdateViewAction
            };
            languageClient.sendNotification('diagram/accept', mes);
        }
    }
}
