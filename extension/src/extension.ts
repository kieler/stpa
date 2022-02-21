import * as vscode from 'vscode';
import { StpaLspVscodeExtension } from './language-extension';
import { SprottyLspVscodeExtension } from 'sprotty-vscode/lib/lsp';

let extension: SprottyLspVscodeExtension;

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Activating STPA extension');
    extension = new StpaLspVscodeExtension(context);
}

export function deactivate(): Thenable<void> {
    if (!extension)
       return Promise.resolve();
    return extension.deactivateLanguageClient();
}