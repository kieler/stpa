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

import * as path from 'path';
import { ActionMessage, JsonMap, SelectAction } from 'sprotty-protocol';
import { SprottyDiagramIdentifier } from 'sprotty-vscode/lib/lsp';
import { LspLabelEditActionHandler, SprottyLspEditVscodeExtension, WorkspaceEditActionHandler } from "sprotty-vscode/lib/lsp/editing";
import { SprottyWebview } from 'sprotty-vscode/lib/sprotty-webview';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { SendCutSetAction, UpdateViewAction } from './actions';
import { ContextTablePanel } from './context-table-panel';
import { StpaFormattingEditProvider } from './stpa-formatter';
import { StpaLspWebview } from './wview';

export class StpaLspVscodeExtension extends SprottyLspEditVscodeExtension {

    protected contextTable: ContextTablePanel;
    protected lastUri: string;
    /** Saves the last selected UCA in the context table. */
    protected lastSelectedUCA: string[];

    /** Indicates whether the language server is ready */
    private resolveLSReady: () => void;
    readonly lsReady = new Promise<void>((resolve) => this.resolveLSReady = resolve);

    /** needed for undo/redo actions when ID enforcement is active*/
    protected ignoreNextTextChange: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        super('pasta', context);
        // user changed configuration settings
        vscode.workspace.onDidChangeConfiguration(() => {
            this.updateViews(this.languageClient, this.lastUri);
            // sends configuration of stpa to the language server
            this.languageClient.sendNotification('configuration', this.collectOptions(vscode.workspace.getConfiguration('pasta')));
        });

        // add auto formatting provider
        const sel: vscode.DocumentSelector = { scheme: 'file', language: 'stpa' }; 
        vscode.languages.registerDocumentFormattingEditProvider(sel, new StpaFormattingEditProvider());

        // handling of notifications regarding the context table
        this.languageClient.onNotification('contextTable/data', data => this.contextTable.setData(data));
        this.languageClient.onNotification('editor/highlight', (msg: { startLine: number, startChar: number, endLine: number, endChar: number; uri: string; }) => {
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
        this.languageClient.onNotification('editor/workspaceedit', ({ edits, uri }) => this.applyTextEdits(edits, uri));
        // laguage server is ready
        this.languageClient.onNotification("ready", () => {
            this.resolveLSReady();
            // open diagram
            vscode.commands.executeCommand(this.extensionPrefix + '.diagram.open', vscode.window.activeTextEditor?.document.uri);
            // sends configuration of stpa to the language server
            this.languageClient.sendNotification('configuration', this.collectOptions(vscode.workspace.getConfiguration('pasta')));
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
        // commands for toggling the provided validation checks
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.checks.setCheckResponsibilitiesForConstraints', async () => {
                this.createQuickPickForWorkspaceOptions("checkResponsibilitiesForConstraints");
            })
        );
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.checks.checkConstraintsForUCAs', async () => {
                this.createQuickPickForWorkspaceOptions("checkConstraintsForUCAs");
            })
        );
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.checks.checkScenariosForUCAs', async () => {
                this.createQuickPickForWorkspaceOptions("checkScenariosForUCAs");
            })
        );
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.checks.checkSafetyRequirementsForUCAs', async () => {
                this.createQuickPickForWorkspaceOptions("checkSafetyRequirementsForUCAs");
            })
        );
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.IDs.undo', async () => {
                this.ignoreNextTextChange = true;
                vscode.commands.executeCommand("undo");
            })
        );
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.IDs.redo', async () => {
                this.ignoreNextTextChange = true;
                vscode.commands.executeCommand("redo");
            })
        ); 
        //commands for computing and displaying the (minimal) cut sets of the fault tree.
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.generate.ftaCutSets', async () =>{ 
                const cutSets:string = await this.languageClient.sendRequest('generate/getCutSets');      
                
                //Send cut sets to webview to display them in a dropdown menu.
                this.dispatchCutSetsToWebview(cutSets);        

                this.createOutputChannel(cutSets, "All cut sets"); 
            })
        );
        this.context.subscriptions.push(
            vscode.commands.registerCommand(this.extensionPrefix + '.generate.ftaMinimalCutSets', async () =>{
                const minimalCutSets:string = await this.languageClient.sendRequest('generate/getMinimalCutSets');

                this.dispatchCutSetsToWebview(minimalCutSets);

                this.createOutputChannel(minimalCutSets, "All minimal cut sets");         
            })
        );     
    }
    /**
     * Sends the cut sets to webview as a SendCutSetAction so that they can be displayed in a dropdown menu.
     * @param cutSets The (minimal) cut sets of the current Fault Tree.
     */
    protected dispatchCutSetsToWebview(cutSets:string):void{
        cutSets = cutSets.substring(cutSets.indexOf("["));
        cutSets = cutSets.slice(1,-2);
        const cutSetArray = cutSets.split(",\n");

        const cutSetDropDownList: { value: any; }[] = [];
            for(const set of cutSetArray){
                cutSetDropDownList.push({value: set});
            }
        this.singleton?.dispatch({ kind: SendCutSetAction.KIND, cutSets: cutSetDropDownList } as SendCutSetAction);
    }

    /**
     * Creates an output channel with the given name and prints the given cut sets. 
     * @param cutSets The cut sets to print.
     * @param channelName The name of the channel.
     */
    protected createOutputChannel(cutSets:string, channelName:string):void{
        const outputCutSets = vscode.window.createOutputChannel(channelName);
        outputCutSets.append(cutSets);
        outputCutSets.show();
    }

    /**
     * Creates a quickpick containing the values "true" and "false". The selected value is set for the 
     * configuration option determined by {@code id}.
     * @param id The id of the configuration option that should be set.
     */
    protected createQuickPickForWorkspaceOptions(id: string): void {
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = [{ label: "true" }, { label: "false" }];
        quickPick.onDidChangeSelection((selection) => {
            if (selection[0]?.label === "true") {
                vscode.workspace.getConfiguration('pasta').update(id, true);
            } else {
                vscode.workspace.getConfiguration('pasta').update(id, false);
            }
            quickPick.hide();
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();

    }

    protected getDiagramType(commandArgs: any[]): string | undefined {
        if (commandArgs.length === 0
            || commandArgs[0] instanceof vscode.Uri && commandArgs[0].path.endsWith('.stpa')) {
            return 'stpa-diagram';
        }
        if(commandArgs[0] instanceof vscode.Uri && commandArgs[0].path.endsWith('.fta')){
            return 'fta-diagram';
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
                    this.singleton?.dispatch(SelectAction.create({ deselectedElementsIDs: this.lastSelectedUCA }));
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

        const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.(stpa|fta)');
        context.subscriptions.push(fileSystemWatcher);

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            documentSelector: [
                { scheme: 'file', language: 'stpa' },
                { scheme: 'file', language: 'fta' }
            ],
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
        languageClient.start();
        // diagram is updated when file changes
        fileSystemWatcher.onDidChange((uri) => this.updateViews(languageClient, uri.toString()));
        return languageClient;
    }

    protected updateViews(languageClient: LanguageClient, uri: string): void {
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
