import { CommonLanguageClient } from 'vscode-languageclient';
import { SprottyLspVscodeExtension } from './sprotty-lsp-vscode-extension';
import { SprottyWebview, SprottyWebviewOptions } from '../sprotty-webview';
export declare class SprottyLspWebview extends SprottyWebview {
    protected options: SprottyWebviewOptions;
    static viewCount: number;
    readonly extension: SprottyLspVscodeExtension;
    constructor(options: SprottyWebviewOptions);
    protected ready(): Promise<void>;
    protected get languageClient(): CommonLanguageClient;
    protected connect(): Promise<void>;
    protected receiveFromWebview(message: any): Promise<boolean>;
}
//# sourceMappingURL=sprotty-lsp-webview.d.ts.map