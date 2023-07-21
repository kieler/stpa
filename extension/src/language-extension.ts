/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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

import { SelectAction } from 'sprotty-protocol';
import { createFileUri } from 'sprotty-vscode';
import { SprottyDiagramIdentifier } from 'sprotty-vscode-protocol';
import { LspWebviewEndpoint, LspWebviewPanelManager, LspWebviewPanelManagerOptions } from 'sprotty-vscode/lib/lsp';
import * as vscode from 'vscode';
import { ContextTablePanel } from './context-table-panel';
import { StpaFormattingEditProvider } from './stpa-formatter';
import { StpaLspWebview } from './wview';

export class StpaLspVscodeExtension extends LspWebviewPanelManager {

    protected extensionPrefix: string;

    contextTable: ContextTablePanel;
    /** Saves the last selected UCA in the context table. */
    protected lastSelectedUCA: string[];

    /** needed for undo/redo actions when ID enforcement is active*/
    ignoreNextTextChange: boolean = false;

    constructor(options: LspWebviewPanelManagerOptions, extensionPrefix: string) {
        super(options);
        this.extensionPrefix = extensionPrefix;
        // user changed configuration settings
        vscode.workspace.onDidChangeConfiguration(() => {
            // sends configuration of stpa to the language server
            options.languageClient.sendNotification('configuration', this.collectOptions(vscode.workspace.getConfiguration('pasta')));
        });

        // add auto formatting provider
        const sel: vscode.DocumentSelector = { scheme: 'file', language: 'stpa' };
        vscode.languages.registerDocumentFormattingEditProvider(sel, new StpaFormattingEditProvider());

        // handling of notifications regarding the context table
        options.languageClient.onNotification('contextTable/data', data => this.contextTable.setData(data));
        options.languageClient.onNotification('editor/highlight', (msg: { startLine: number, startChar: number, endLine: number, endChar: number; uri: string; }) => {
            // highlight and reveal the given range in the editor
            const editor = vscode.window.visibleTextEditors.find(visibleEditor => visibleEditor.document.uri.toString() === msg.uri);
            if (editor) {
                const startPosition = new vscode.Position(msg.startLine, msg.startChar);
                const endPosition = new vscode.Position(msg.endLine, msg.endChar);
                editor.selection = new vscode.Selection(startPosition, endPosition);
                editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
            }
        });

        // textdocument has changed
        vscode.workspace.onDidChangeTextDocument(changeEvent => { this.handleTextChangeEvent(changeEvent); });
        // language client sent workspace edits
        options.languageClient.onNotification('editor/workspaceedit', ({ edits, uri }) => this.applyTextEdits(edits, uri));
        // laguage server is ready
        options.languageClient.onNotification("ready", () => {
            // open diagram
            vscode.commands.executeCommand(this.extensionPrefix + '.diagram.open', vscode.window.activeTextEditor?.document.uri);
            // sends configuration of stpa to the language server
            options.languageClient.sendNotification('configuration', this.collectOptions(vscode.workspace.getConfiguration('pasta')));
        });
    }

    /**
     * Notifies the language server that a textdocument has changed.
     * @param changeEvent The change in the text document.
     */
    protected handleTextChangeEvent(changeEvent: vscode.TextDocumentChangeEvent): void {
        // if the change should be ignored (e.g. for a redo/undo action), the language server is not notified.
        if (this.ignoreNextTextChange) {
            this.ignoreNextTextChange = false;
            return;
        }
        // send the changes to the language server
        const changes = changeEvent.contentChanges;
        const uri = changeEvent.document.uri.toString();
        this.languageClient.sendNotification('editor/textChange', { changes: changes, uri: uri });
    }

    /**
     * Applies text edits to the document.
     * @param edits The edits to apply.
     * @param uri The uri of the document that should be edited.
     */
    protected async applyTextEdits(edits: vscode.TextEdit[], uri: string): Promise<void> {
        // create a workspace edit
        const workSpaceEdit = new vscode.WorkspaceEdit();
        workSpaceEdit.set(vscode.Uri.parse(uri), edits);
        // Apply the edit. Report possible failures.
        const edited = await vscode.workspace.applyEdit(workSpaceEdit);
        if (!edited) {
            console.error("Workspace edit could not be applied!");
            return;
        }
    }

    /**
     * Collects the STPA options of the configuration settings and returns them as a list of their ids and values.
     * @param configuration The workspace configuration options.
     * @returns A list of the workspace options, whereby a option is represented with an id and its value.
     */
    protected collectOptions(configuration: vscode.WorkspaceConfiguration): { id: string, value: any; }[] {
        const values: { id: string, value: any; }[] = [];
        values.push({ id: "checkResponsibilitiesForConstraints", value: configuration.get("checkResponsibilitiesForConstraints") });
        values.push({ id: "checkConstraintsForUCAs", value: configuration.get("checkConstraintsForUCAs") });
        values.push({ id: "checkScenariosForUCAs", value: configuration.get("checkScenariosForUCAs") });
        values.push({ id: "checkSafetyRequirementsForUCAs", value: configuration.get("checkSafetyRequirementsForUCAs") });
        return values;
    }


    // protected getDiagramType(uri: vscode.Uri): string | undefined {
    //     if (commandArgs.length === 0
    //         || commandArgs[0] instanceof vscode.Uri && commandArgs[0].path.endsWith('.stpa')) {
    //         return 'stpa-diagram';
    //     }
    //     return undefined;
    // }

    createContextTable(context: vscode.ExtensionContext): void {
        const extensionPath = this.options.extensionUri.fsPath;
        const tablePanel = new ContextTablePanel(
            'Context-Table',
            [createFileUri(extensionPath, 'pack')],
            createFileUri(extensionPath, 'pack', 'context-table-panel.js')
        );
        this.contextTable = tablePanel;

        // adds listener for mouse click on a cell
        context.subscriptions.push(
            this.contextTable.cellClicked((cell: { rowId: string; columnId: string, text?: string; } | undefined) => {
                if (cell?.text === "No") {
                    // delete selection in the diagram
                    this.endpoints[0].sendAction(SelectAction.create({ deselectedElementsIDs: this.lastSelectedUCA }));
                    this.lastSelectedUCA = [];
                } else if (cell?.text) {
                    const texts = cell.text.split(",");
                    // language server must determine the range of the selected uca in the editor in order to highlight it
                    // when there are multiple UCAs in the cell only the first one is highlighted in the editor
                    this.languageClient.sendNotification('contextTable/selected', texts[0]);
                    // highlight corresponding node in the diagram and maybe deselect the last selected one
                    this.endpoints[0].sendAction(SelectAction.create({ selectedElementsIDs: texts, deselectedElementsIDs: this.lastSelectedUCA }));
                    this.lastSelectedUCA = texts;
                }
            })
        );
    }

    protected override createEndpoint(identifier: SprottyDiagramIdentifier): LspWebviewEndpoint {
        const webviewContainer = this.createWebview(identifier);
        const participant = this.messenger.registerWebviewPanel(webviewContainer);
        return new StpaLspWebview({
            languageClient: this.languageClient,
            webviewContainer,
            messenger: this.messenger,
            messageParticipant: participant,
            identifier
        });
    }

}
