/* eslint-disable @typescript-eslint/no-namespace */
/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { Cell } from "./helper";

interface Action {
    kind: string;
}

/** Adds a row to the table. */
export interface AddRowAction extends Action {
    kind: typeof AddRowAction.KIND;
    rowId: string;
    values: Cell[];
}


export namespace AddRowAction {
    export const KIND = "addRow";

    export function create(
        rowId: string,
        values: Cell[]
    ): AddRowAction {
        return {
            kind: AddRowAction.KIND,
            rowId,
            values
        };
    }

    export function isThisAction(action: Action): action is AddRowAction {
        return action.kind === AddRowAction.KIND;
    }
}

/** Updates a cell of the table. A new cell is added if necessary */
export interface UpdateCellAction extends Action {
    kind: typeof UpdateCellAction.KIND;
    rowId: string;
    columnId: string;
    value: Cell;
}


export namespace UpdateCellAction {
    export const KIND = "updateCell";

    export function create(
        rowId: string,
        columnId: string,
        value: Cell
    ): UpdateCellAction {
        return {
            kind: UpdateCellAction.KIND,
            rowId,
            columnId,
            value
        };
    }

    export function isThisAction(action: Action): action is UpdateCellAction {
        return action.kind === UpdateCellAction.KIND;
    }
}

/** Resets the table to the headers. */
export interface ResetTableAction extends Action {
    kind: typeof ResetTableAction.KIND;
}


export namespace ResetTableAction {
    export const KIND = "resetTable";

    export function create(): ResetTableAction {
        return {
            kind: ResetTableAction.KIND
        };
    }

    export function isThisAction(action: Action): action is ResetTableAction {
        return action.kind === ResetTableAction.KIND;
    }
}

/** Sends the Id of the selected row to the client */
export interface SelectedCellAction extends Action {
    kind: typeof SelectedCellAction.KIND;
    rowId: string;
    columnId: string;
}


export namespace SelectedCellAction {
    export const KIND = "selectRow";

    export function create(rowId: string, columnId: string): SelectedCellAction {
        return {
            kind: KIND,
            rowId: rowId,
            columnId: columnId
        };
    }

    export function isThisAction(action: Action): action is SelectedCellAction {
        return action.kind === SelectedCellAction.KIND;
    }
}