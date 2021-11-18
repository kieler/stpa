import * as vscode from 'vscode';
import * as path from 'path';

import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let languageClient: LanguageClient | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
    languageClient = startLanguageClient(context);
}

/* function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
    const executable = process.platform === 'win32' ? 'states-language-server.bat' : 'states-language-server';
    const languageServerPath =  path.join('server', 'states-language-server', 'bin', executable);
    const serverLauncher = context.asAbsolutePath(languageServerPath);
    const serverOptions: ServerOptions = {
        run: {
            command: serverLauncher,
            args: ['-trace']
        },
        debug: {
            command: serverLauncher,
            args: ['-trace']
        }
    };
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'states' }],
    };
    languageClient = new LanguageClient('statesLanguageClient', 'States Language Server', serverOptions, clientOptions);
    languageClient.start();
    return languageClient;
} */

export function deactivate(): Thenable<void> {
    if (!languageClient)
       return Promise.resolve(undefined);
    return languageClient.stop();
}


function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
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