import * as vscode from 'vscode';
import { STPALspVscodeExtension } from './language-extension';
import { SprottyLspVscodeExtension } from 'sprotty-vscode/lib/lsp';

let extension: SprottyLspVscodeExtension;

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Activating stpa extension');
    extension = new STPALspVscodeExtension(context);
}

export function deactivate(): Thenable<void> {
    if (!extension)
       return Promise.resolve();
    return extension.deactivateLanguageClient();
}