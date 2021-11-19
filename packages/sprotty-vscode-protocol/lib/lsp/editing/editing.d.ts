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
import { Action } from "../../sprotty";
import { Location, WorkspaceEdit } from 'vscode-languageserver-protocol';
export declare namespace LspLabelEditAction {
    const KIND = "languageLabelEdit";
    function is(action: Action): action is LspLabelEditAction;
}
export interface LspLabelEditAction extends Action {
    location: Location;
    editKind: "xref" | "name";
    initialText: string;
}
export declare namespace WorkspaceEditAction {
    const KIND = "workspaceEdit";
    function is(action: Action): action is WorkspaceEditAction;
}
export interface WorkspaceEditAction extends Action {
    workspaceEdit: WorkspaceEdit;
}
export declare namespace DeleteWithWorkspaceEditAction {
    const KIND = "deleteWithWorkspaceEdit";
    function is(action: Action): action is DeleteWithWorkspaceEditAction;
}
export interface DeleteWithWorkspaceEditAction extends Action {
}
//# sourceMappingURL=editing.d.ts.map