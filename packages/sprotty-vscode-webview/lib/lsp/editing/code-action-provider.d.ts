import { SprottyDiagramIdentifier } from 'sprotty-vscode-protocol';
import { CodeAction, Range, Command } from 'vscode-languageserver-protocol';
import { LanguageClientProxy } from './language-client-proxy';
export declare class CodeActionProvider {
    readonly languageClientProxy: LanguageClientProxy;
    readonly diagramIdentifier: SprottyDiagramIdentifier;
    getCodeActions(range: Range, codeActionKind: string): Promise<(CodeAction | Command)[]>;
}
//# sourceMappingURL=code-action-provider.d.ts.map