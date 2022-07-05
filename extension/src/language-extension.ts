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
import { acceptMessageType, SprottyDiagramIdentifier, SprottyLspWebview } from 'sprotty-vscode/lib/lsp';
import { SprottyWebview } from 'sprotty-vscode/lib/sprotty-webview';
import { ActionMessage, JsonMap } from 'sprotty-protocol';
import { AddTemplateAction, UpdateViewAction } from './actions';

export class StpaLspVscodeExtension extends SprottyLspEditVscodeExtension {

    clientId: string | undefined;

    constructor(context: vscode.ExtensionContext) {
        super('stpa', context);
        this.languageClient.onReady().then(() => {
            this.languageClient.onNotification('editor/add', this.handleWorkSpaceEdit.bind(this));
        });
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.templates.add', async (...commandArgs: any) => {
                this.addTemplate(commandArgs);
            }));
    }

    /**
     * Sends an AddTemplateAction to the language server containing the selected text.
     * @param commandArgs 
     */
    protected async addTemplate(commandArgs: any[]) {
        const activeEditor = vscode.window.activeTextEditor;
        const sel = activeEditor?.selection;
        const doc = activeEditor?.document;
        if (doc && sel) {
            if (!this.clientId) {
                const identifier = await this.createDiagramIdentifier(commandArgs);
                this.clientId = identifier?.clientId;
            }
            const text = doc.getText().substring(doc.offsetAt(sel.start), doc.offsetAt(sel?.end));
            const mes: ActionMessage = {
                clientId: this.clientId!,
                action: {
                    kind: AddTemplateAction.KIND,
                    text: text
                } as AddTemplateAction
            };
            this.languageClient.sendNotification(acceptMessageType, mes);
        }
    }

    /**
     * Handle WorkSpaceEdit notifications form the langauge server
     * @param msg Message contianing the uri of the document, the text to insert, and the position in the document ot insert it to.
     */
    protected async handleWorkSpaceEdit(msg: { uri: string, text: string, position: vscode.Position; }) {
        const textDocument = vscode.workspace.textDocuments.find(
            (doc) => doc.uri.toString() === vscode.Uri.parse(msg.uri).toString()
        );
        if (!textDocument) {
            console.error(
                `Server requested a text edit but the requested uri was not found among the known documents: ${msg.uri}`
            );
            return;
        }
        const workSpaceEdit = new vscode.WorkspaceEdit();
        const pos = this.languageClient.protocol2CodeConverter.asPosition(msg.position);
        const edits: vscode.TextEdit[] = [vscode.TextEdit.insert(pos, msg.text)];
        workSpaceEdit.set(textDocument.uri, edits);

        // Apply and save the edit. Report possible failures.
        const edited = await vscode.workspace.applyEdit(workSpaceEdit);
        if (!edited) {
            console.error("Workspace edit could not be applied!");
            return;
        }

        //await textDocument.save();
        return;
    }

    protected getDiagramType(commandArgs: any[]): string | undefined {
        if (commandArgs.length === 0
            || commandArgs[0] instanceof vscode.Uri && commandArgs[0].path.endsWith('.stpa')) {
            return 'stpa-diagram';
        }
        return undefined;
    }

    createWebView(identifier: SprottyDiagramIdentifier): SprottyWebview {
        const webview = new SprottyLspWebview({
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
        this.clientId = identifier.clientId;
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
        // TODO: should already work automatically. does not work on windows due to representation of path -> '%3A' is used instead of ':' in one of the uris.
        // diagram is updated when file changes
        fileSystemWatcher.onDidChange(() => this.sendUpdateView(languageClient));
        return languageClient;
    }

    protected sendUpdateView(languageClient: LanguageClient) {
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
            languageClient.sendNotification(acceptMessageType, mes);
        }
    }
}
