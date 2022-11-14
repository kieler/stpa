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
import { LanguageClient, LanguageClientOptions, Range, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { LspLabelEditActionHandler, WorkspaceEditActionHandler, SprottyLspEditVscodeExtension } from "sprotty-vscode/lib/lsp/editing";
import { SprottyDiagramIdentifier } from 'sprotty-vscode/lib/lsp';
import { SprottyWebview } from 'sprotty-vscode/lib/sprotty-webview';
import { ActionMessage, JsonMap } from 'sprotty-protocol';
import { UpdateViewAction } from './actions';
import { ContextTablePanel } from './context-table-panel';
import { StpaFormattingEditProvider } from './stpa-formatter';
import { StpaLspWebview } from './wview';
import { SelectAction } from 'sprotty-protocol';

export class StpaLspVscodeExtension extends SprottyLspEditVscodeExtension {

    protected contextTable: ContextTablePanel;
    protected lastUri: string;
    /** Saves the last selected UCA in the context table. */
    protected lastSelectedUCA: string[];

    constructor(context: vscode.ExtensionContext) {
        super('stpa', context);
        let sel: vscode.DocumentSelector = { scheme: 'file', language: 'stpa' };
        vscode.languages.registerDocumentFormattingEditProvider(sel, new StpaFormattingEditProvider());
        this.languageClient.onReady().then(() => {
            // handling of notifications regarding the context table
            this.languageClient.onNotification('contextTable/data', data => this.contextTable.setData(data));
            this.languageClient.onNotification('contextTable/highlight', (msg: { startLine: number, startChar: number, endLine: number, endChar: number; }) => {
                // highlight and reveal the given range in the editor
                const editor = vscode.window.visibleTextEditors.find(visibleEditor => visibleEditor.document.uri.toString() === this.lastUri);
                if (editor) {
                    const startPosition = new vscode.Position(msg.startLine, msg.startChar);
                    const endPosition = new vscode.Position(msg.endLine, msg.endChar);
                    editor.selection = new vscode.Selection(startPosition, endPosition);
                    editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
                }
            });
        });
    }

    protected registerCommands(): void {
        super.registerCommands();
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.contextTable.open', async (...commandArgs: any[]) => {
                this.createContextTable();
                await this.contextTable.ready();
                this.lastUri = (commandArgs[0] as vscode.Uri).toString();
                this.languageClient.sendNotification('contextTable/getData', this.lastUri);
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
        const tablePanel = new ContextTablePanel(
            'Context-Table',
            [this.getExtensionFileUri('pack')],
            this.getExtensionFileUri('pack', 'context-table-panel.js')
        );
        this.contextTable = tablePanel;

        // adds listener for mouse click on a cell
        this.context.subscriptions.push(
            this.contextTable.cellClicked((cell: { rowId: string; columnId: string, text?: string; } | undefined) => {
                if (cell?.text === "No") {
                    // delete selection in the diagram
                    this.singleton?.dispatch(SelectAction.create({  deselectedElementsIDs: this.lastSelectedUCA }));
                    this.lastSelectedUCA = [];
                } else if (cell?.text) {
                    const texts = cell.text.split(",");
                    // language server must determine the range of the selected uca in the editor in order to highlight it
                    // when there are multiple UCAs in the cell only the first one is highlighted in the editor
                    this.languageClient.sendNotification('contextTable/selected', texts[0]);
                    // highlight corresponding node in the diagram and maybe deselect the last selected one
                    this.singleton?.dispatch(SelectAction.create({ selectedElementsIDs: texts, deselectedElementsIDs: this.lastSelectedUCA }));
                    this.lastSelectedUCA = texts;
                }
            })
        );
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

        // languageClient.onReady().then(() => {
        //     languageClient.onNotification('contextTable/data', data => this.contextTable.setData(data));
        //     languageClient.onNotification('contextTable/highlight', (msg: {startLine: number, startChar: number, endLine: number, endChar: number}) => {
        //         const editor = vscode.window.visibleTextEditors.find(visibleEditor => visibleEditor.document.uri.toString() === this.lastUri);
        //         if (editor) {
        //             const startPosition = new vscode.Position(msg.startLine, msg.startChar);
        //             const endPosition = new vscode.Position(msg.endLine, msg.endChar);
        //             editor.selection = new vscode.Selection(startPosition, endPosition);
        //             editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
        //         }
        //     })
        // });
        return languageClient;
    }

    protected updateViews(languageClient: LanguageClient, uri: string) {
        this.lastUri = uri;
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
