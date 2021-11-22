import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { LspLabelEditActionHandler, WorkspaceEditActionHandler, SprottyLspEditVscodeExtension } from "sprotty-vscode/lib/lsp/editing";
import { SprottyDiagramIdentifier, SprottyLspWebview } from 'packages-vscode/lib/lsp';
import { SprottyWebview } from 'sprotty-vscode/lib/sprotty-webview';

export class STPALspVscodeExtension extends SprottyLspEditVscodeExtension {

    constructor(context: vscode.ExtensionContext) {
        super('stpa', context);
    }

    protected getDiagramType(commandArgs: any[]): string | undefined {
        if (commandArgs.length === 0
            || commandArgs[0] instanceof vscode.Uri && commandArgs[0].path.endsWith('.stpa')) {
            return 'stpa-diagram';
        }
        return undefined
    }

    createWebView(identifier: SprottyDiagramIdentifier): SprottyWebview {
        const webview = new SprottyLspWebview({
            extension: this,
            identifier,
            localResourceRoots: [
                this.getExtensionFileUri('out')
            ],
            scriptUri: this.getExtensionFileUri('out', 'webview.js'),
            singleton: false // Change this to `true` to enable a singleton view
        });
        webview.addActionHandler(WorkspaceEditActionHandler);
        webview.addActionHandler(LspLabelEditActionHandler);
        return webview;
    }

    protected activateLanguageClient(context: vscode.ExtensionContext): LanguageClient {
        const serverModule = context.asAbsolutePath(path.join('out', 'language-server', 'main'));
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
        const client = new LanguageClient(
            'stpa',
            'stpa',
            serverOptions,
            clientOptions
        );
    
        // Start the client. This will also launch the server
        client.start();
        return client;
    }
}