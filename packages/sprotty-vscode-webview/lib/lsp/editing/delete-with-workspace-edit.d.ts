/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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
import { CommandExecutionContext, Selectable, SModelElement, Command, CommandReturn, IActionDispatcher } from "sprotty";
import { DeleteWithWorkspaceEditAction } from 'sprotty-vscode-protocol/lib/lsp/editing';
import { Range, WorkspaceEdit } from 'vscode-languageserver-protocol';
import { Traceable } from "./traceable";
export declare class DeleteWithWorkspaceEditCommand extends Command {
    readonly action: DeleteWithWorkspaceEditAction;
    static readonly KIND = "deleteWithWorkspaceEdit";
    actionDispatcher: IActionDispatcher;
    constructor(action: DeleteWithWorkspaceEditAction);
    createWorkspaceEdit(context: CommandExecutionContext): WorkspaceEdit;
    protected containsRange(range: Range, otherRange: Range): boolean;
    protected shouldDelete<T extends SModelElement>(e: T): e is (Traceable & Selectable & T);
    protected shouldDeleteParent(source: SModelElement | undefined): boolean;
    execute(context: CommandExecutionContext): CommandReturn;
    undo(context: CommandExecutionContext): CommandReturn;
    redo(context: CommandExecutionContext): CommandReturn;
}
//# sourceMappingURL=delete-with-workspace-edit.d.ts.map