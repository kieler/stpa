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
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';
export declare function convertWorkspaceEdit(workspaceEdit: lsp.WorkspaceEdit): vscode.WorkspaceEdit;
export declare function convertTextEdit(textEdit: lsp.TextEdit): vscode.TextEdit;
export declare function convertRange(range: lsp.Range): vscode.Range;
export declare function convertPosition(position: lsp.Position): vscode.Position;
export declare function convertUri(uri: string): vscode.Uri;
//# sourceMappingURL=lsp-to-vscode.d.ts.map