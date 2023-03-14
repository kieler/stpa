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

import { AddRowAction, ResetTableAction, SelectedCellAction, UpdateCellAction } from './actions';
import { createCell, createRow, createTable, patch } from './html';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Table {

    protected identifier: string;
    protected headers: string[];

    constructor() {
        vscode.postMessage({ readyMessage: 'Webview ready' });
        // add listener for messages
        const eventListener = (message: any) => {
            this.handleMessages(message);
        };
        window.addEventListener('message', eventListener);

        document.addEventListener('click', event => {
            const node = event.target;
            const owner = (node as HTMLElement).parentElement;
            if (owner) {
                const action = SelectedCellAction.create(owner.id, (node as HTMLElement).id, (node as HTMLElement).innerText);
                vscode.postMessage({ action: action });
            }
        });
    }

    /**
     * Handles incoming messages from the extension.
     * @param message The received Message.
     */
    protected handleMessages(message: any): void {
        if (message.data.identifier) {
            this.initHtml(message.data.identifier, message.data.headers);
        } else if (message.data.action) {
            const action = message.data.action;
            if (AddRowAction.isThisAction(action)) {
                this.handleAddRow(action as AddRowAction);
            } else if (UpdateCellAction.isThisAction(action)) {
                this.handleUpdateCell(action as UpdateCellAction);
            } else if (ResetTableAction.isThisAction(action)) {
                this.handleResetTable();
            }
        } else {
            console.log("Message not supported: ", message);
        }
    }

    /**
     * Initializes the webview with a header and a placeholder for the table.
     * @param identifier The identifier of the element that should contain the webview.
     */
    protected initHtml(identifier: string, headers: string[]): void {
        this.identifier = identifier;
        this.headers = headers;
        const containerDiv = document.getElementById(identifier + '_container');
        if (containerDiv) {
            const tablePlaceholder = document.createElement("table");
            containerDiv.appendChild(tablePlaceholder);
            const table = createTable(identifier, headers);
            patch(tablePlaceholder, table);
        }
    }

    /**
     * Adds a row to the table at the bottom.
     * @param action AddRowAction that determines the values and Id of the new row.
     */
    protected handleAddRow(action: AddRowAction): void {
        const table = document.getElementById(this.identifier + '_table');
        if (table) {
            const rowPlaceholder = document.createElement("tr");
            table.appendChild(rowPlaceholder);
            const row = createRow(action.rowId, action.values);
            patch(rowPlaceholder, row);
        }
    }

    /**
     * Updates a cell in the table.
     * @param action Action that contains the Id and new value of the cell.
     */
    protected handleUpdateCell(action: UpdateCellAction): void {
        const row = document.getElementById(action.rowId);
        const column = this.headers.indexOf(action.columnId);
        const newCell = createCell(action.columnId, action.value);
        if (row) {
            if (column < row.children.length) {
                // cell exists already
                patch(row.children[column], newCell);
            } else {
                // row might be so short that we need to add empty cells in order to add the new value to the desired cell
                for (let i = row.children.length; i < column; i++) {
                    const cell = document.createElement("td");
                    row.appendChild(cell);
                }
                // add new cell
                const cellPlaceholder = document.createElement("td");
                row.appendChild(cellPlaceholder);
                patch(cellPlaceholder, newCell);
            }
        }
    }

    /**
     * Resets the table to the headers.
     */
    protected handleResetTable(): void {
        const table = document.getElementById(this.identifier + '_table');
        if (table) {
            const newTable = createTable(this.identifier, this.headers);
            patch(table, newTable);
        }
    }

}
