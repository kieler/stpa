/********************************************************************************
 * Copyright (c) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { Action } from 'sprotty-vscode-protocol';
import { LspLabelEditAction } from 'sprotty-vscode-protocol/lib/lsp/editing';
import { CompletionItem } from 'vscode-languageclient';
import { CommonLanguageClient } from 'vscode-languageclient';
import { ActionHandler } from '../../action-handler';
import { SprottyWebview } from '../../sprotty-webview';
export declare class LspLabelEditActionHandler implements ActionHandler {
    readonly webview: SprottyWebview;
    readonly kind = "languageLabelEdit";
    constructor(webview: SprottyWebview);
    handleAction(action: Action): Promise<boolean>;
    protected get languageClient(): CommonLanguageClient;
    chooseCrossReference(action: LspLabelEditAction): Promise<boolean>;
    protected filterCompletionItems(items: CompletionItem[]): CompletionItem[];
    renameElement(action: LspLabelEditAction): Promise<boolean>;
}
//# sourceMappingURL=lsp-label-edit-action-handler.d.ts.map