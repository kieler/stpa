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
import { registerDefaultCommands } from 'sprotty-vscode';
import { LspSprottyEditorProvider, LspSprottyViewProvider } from 'sprotty-vscode/lib/lsp';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { Messenger } from 'vscode-messenger';
import { command } from './constants';
import { StpaLspVscodeExtension } from './language-extension';
import { createOutputChannel, createQuickPickForWorkspaceOptions } from './utils';
import { createSTPAResultMarkdownFile } from './report/md-export';
import { LTLFormula } from './sbm/utils';
import { createSBMs } from './sbm/sbm-generation';
import { StpaResult } from './report/utils';
import { SendCutSetAction } from './actions';

let languageClient: LanguageClient;

export function activate(context: vscode.ExtensionContext): void {
    vscode.window.showInformationMessage('Activating STPA extension');

    const diagramMode = process.env.DIAGRAM_MODE || 'panel';
    if (!['panel', 'editor', 'view'].includes(diagramMode)) {
        throw new Error("The environment variable 'DIAGRAM_MODE' must be set to 'panel', 'editor' or 'view'.");
    }

    languageClient = createLanguageClient(context);

    if (diagramMode === 'panel') {
        // Set up webview panel manager for freestyle webviews
        const webviewPanelManager = new StpaLspVscodeExtension({
            extensionUri: context.extensionUri,
            languageClient,
            supportedFileExtensions: ['.stpa', '.fta'],
            singleton: true,
            messenger: new Messenger({ ignoreHiddenViews: false })
        }, 'pasta');
        registerDefaultCommands(webviewPanelManager, context, { extensionPrefix: 'pasta' });
        registerTextEditorSync(webviewPanelManager, context);
        registerSTPACommands(webviewPanelManager, context, { extensionPrefix: 'pasta' });
    }

    if (diagramMode === 'editor') {
        // Set up webview editor associated with file type
        const webviewEditorProvider = new LspSprottyEditorProvider({
            extensionUri: context.extensionUri,
            viewType: 'stpa',
            languageClient,
            supportedFileExtensions: ['.stpa']
        });
        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider('stpa', webviewEditorProvider, {
                webviewOptions: { retainContextWhenHidden: true }
            })
        );
        registerDefaultCommands(webviewEditorProvider, context, { extensionPrefix: 'stpa' });
    }

    if (diagramMode === 'view') {
        // Set up webview view shown in the side panel
        const webviewViewProvider = new LspSprottyViewProvider({
            extensionUri: context.extensionUri,
            viewType: 'stpa',
            languageClient,
            supportedFileExtensions: ['.stpa'],
            openActiveEditor: true,
            messenger: new Messenger({ ignoreHiddenViews: false })
        });

        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('states', webviewViewProvider, {
                webviewOptions: { retainContextWhenHidden: true }
            })
        );
        registerDefaultCommands(webviewViewProvider, context, { extensionPrefix: 'stpa' });
    }
}

export async function deactivate(): Promise<void> {
    if (languageClient) {
        await languageClient.stop();
    }
}

function registerSTPACommands(manager: StpaLspVscodeExtension, context: vscode.ExtensionContext, options: { extensionPrefix: string; }): void {
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.contextTable.open', async (...commandArgs: any[]) => {
            manager.createContextTable(context);
            await manager.contextTable.ready();
            const uri = (commandArgs[0] as vscode.Uri).toString();
            languageClient.sendNotification('contextTable/getData', uri);
        })
    );
    // commands for toggling the provided validation checks
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.checks.setCheckResponsibilitiesForConstraints', async () => {
            createQuickPickForWorkspaceOptions("checkResponsibilitiesForConstraints");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.checks.checkConstraintsForUCAs', async () => {
            createQuickPickForWorkspaceOptions("checkConstraintsForUCAs");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.checks.checkScenariosForUCAs', async () => {
            createQuickPickForWorkspaceOptions("checkScenariosForUCAs");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.checks.checkSafetyRequirementsForUCAs', async () => {
            createQuickPickForWorkspaceOptions("checkSafetyRequirementsForUCAs");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.IDs.undo', async () => {
            manager.ignoreNextTextChange = true;
            vscode.commands.executeCommand("undo");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.IDs.redo', async () => {
            manager.ignoreNextTextChange = true;
            vscode.commands.executeCommand("redo");
        })
    );

    // command for creating a pdf
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.md.creation', async (uri: vscode.Uri) => {
            const data: StpaResult = await languageClient.sendRequest('result/getData', uri.toString());
            await createSTPAResultMarkdownFile(data, manager);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.SBM.generation', async (uri: vscode.Uri) => {
            await manager.lsReady;
            const formulas: Record<string, LTLFormula[]> = await languageClient.sendRequest('verification/generateLTL', uri.path);
            // controlAction names are just the action without the controller as prefix
            // generate a safe behavioral model
            const controlActions: Record<string, string[]> = await languageClient.sendRequest('verification/getControlActions', uri.path);
            createSBMs(controlActions, formulas);
        })
    );

    // register commands that other extensions can use
    context.subscriptions.push(vscode.commands.registerCommand(
        command.getLTLFormula,
        async (uri: string) => {
            // generate and send back the LTLs based on the STPA UCAs
            await manager.lsReady;
            const formulas: Record<string, LTLFormula[]> = await languageClient.sendRequest('verification/generateLTL', uri);
            return formulas;
        }
    ));

    // commands for computing and displaying the (minimal) cut sets of the fault tree.
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.generate.ftaCutSets', async () =>{ 
            const cutSets:string = await languageClient.sendRequest('generate/getCutSets');      
            //Send cut sets to webview to display them in a dropdown menu.
            dispatchCutSetsToWebview(manager, cutSets);        
            createOutputChannel(cutSets, "FTA Cut Sets"); 
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(options.extensionPrefix + '.generate.ftaMinimalCutSets', async () =>{
            const minimalCutSets:string = await languageClient.sendRequest('generate/getMinimalCutSets');
            dispatchCutSetsToWebview(manager, minimalCutSets);
            createOutputChannel(minimalCutSets, "FTA Cut Sets");         
        })
    ); 
}

/**
     * Sends the cut sets to webview as a SendCutSetAction so that they can be displayed in a dropdown menu.
     * @param cutSets The (minimal) cut sets of the current Fault Tree.
     */
function dispatchCutSetsToWebview(manager: StpaLspVscodeExtension, cutSets:string):void{
    cutSets = cutSets.substring(cutSets.indexOf("["));
    cutSets = cutSets.slice(1,-2);
    const cutSetArray = cutSets.split(",\n");

    const cutSetDropDownList: { value: any; }[] = [];
        for(const set of cutSetArray){
            cutSetDropDownList.push({value: set});
        }
        manager.endpoints.find(endpoint => endpoint.diagramIdentifier?.diagramType === 'fta')?.sendAction({ kind: SendCutSetAction.KIND, cutSets: cutSetDropDownList } as SendCutSetAction);
        // manager.endpoints.find(endpoint => endpoint.diagramIdentifier?.uri.endsWith('.fta'))?.sendAction({ kind: SendCutSetAction.KIND, cutSets: cutSetDropDownList } as SendCutSetAction);
    }

function createLanguageClient(context: vscode.ExtensionContext): LanguageClient {
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

    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.{stpa,fta}');
    context.subscriptions.push(fileSystemWatcher);

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'stpa' },
        { scheme: 'file', language: 'fta' }],
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
    return languageClient;
}

function registerTextEditorSync(manager: StpaLspVscodeExtension, context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async document => {
            if (document) {
                manager.openDiagram(document.uri);
            }
        })
    );
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async document => {
            if (document) {
                manager.openDiagram(document.uri);
                if (manager.contextTable) {
                    languageClient.sendNotification('contextTable/getData', document.uri.toString());
                }
            }
        })
    );
}