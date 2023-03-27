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

import * as vscode from 'vscode';
import { AddRowAction, ResetTableAction, SelectedCellAction, UpdateCellAction } from './actions';
import { Cell } from './helper';

export class TableWebview {

    protected disposables: vscode.Disposable[] = [];

    protected title: string;

    protected headers: string[];

    static viewCount = 0;

    readonly identifier: string;

    readonly localResourceRoots: vscode.Uri[];

    readonly scriptUri: vscode.Uri;

    webview: vscode.Webview;

    diagramPanel: vscode.WebviewPanel;

    private resolveWebviewReady: () => void;

    private readonly webviewReady = new Promise<void>((resolve) => (this.resolveWebviewReady = resolve));

    protected selectedCell: {rowId: string, columnId: string, text?: string};

    public readonly cellClickedEmitter = new vscode.EventEmitter<{rowId: string, columnId: string, text?: string} | undefined>();

    public readonly cellClicked: vscode.Event<{rowId: string, columnId: string, text?: string} | undefined> = this.cellClickedEmitter.event;

    public readonly initializedEmitter = new vscode.EventEmitter<void | undefined>();

    public readonly initialized: vscode.Event<void | undefined> = this.initializedEmitter.event;

    constructor(identifier: string, localResourceRoots: vscode.Uri[], scriptUri: vscode.Uri) {
        this.identifier = identifier;
        this.localResourceRoots = localResourceRoots;
        this.scriptUri = scriptUri;
    }

    ready(): Promise<void> {
        return this.webviewReady;
    }

    createTitle(): string {
        return this.identifier;
    }

    getSelectedRow() {
        return this.selectedCell;
    }

    /**
     * Creates a diagram panel and initializes the webview.
     * @param headers Headers of the table.
     */
    protected createWebviewPanel(headers: string[]): void {
        const title = this.createTitle();
        const diagramPanel = vscode.window.createWebviewPanel('table', title, vscode.ViewColumn.Beside, {
            localResourceRoots: this.localResourceRoots,
            enableScripts: true,
            enableFindWidget: true
        });
        this.initializeWebview(diagramPanel.webview, title, headers);
        this.diagramPanel = diagramPanel;
        this.diagramPanel.onDidDispose(() => {
            this.disposables.forEach(d => d.dispose());
        });
    }

    /**
     * Initializes the webview html and saves the headers.
     * @param webview The webview to initialize.
     * @param title The title of the webview.
     * @param headers The headers of the table.
     */
    async initializeWebview(webview: vscode.Webview, title: string, headers: string[]) {
        this.headers = headers;
        webview.html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, height=device-height">
                    <title>${title}</title>
                </head>
                <body>
                    <div id="${this.identifier}_container" style="height: 100%;"></div>
                    <script> const vscode = acquireVsCodeApi();</script>
                    <script src="${webview.asWebviewUri(this.scriptUri).toString()}"></script>
                </body>
            </html>`;
        this.webview = webview;
        this.connect();
    }

    /**
     * Adds a row to the table.
     * @param values The values of the row in correct ordering.
     * @param rowId Id of the row to add.
     */
    async addRow(rowId: string, ...values: Cell[]) {
        await this.ready();
        this.sendToWebview({ action: AddRowAction.create(rowId, values) });
    }

    /**
     * Updates a cells.
     * @param rowId The Id of the row of the cell.
     * @param columnId The id of the column of the cell.
     * @param value The new value for the cell.
     */
    async updateCell(rowId: string, columnId: string, value: Cell) {
        await this.ready();
        this.sendToWebview({ action: UpdateCellAction.create(rowId, columnId, value) });
    }

    /**
     * Resets the table to the headers.
     */
    async reset() {
        await this.ready();
        this.sendToWebview({ action: ResetTableAction.create() });
    }

    /**
     * Registers listener for webview notifications.
     */
    protected async connect() {
        this.disposables.push(this.webview.onDidReceiveMessage((message) => this.receiveFromWebview(message)));
        await this.ready();
    }

    /**
     * Sends identifier to the webview.
     */
    protected async sendTableIdentifier() {
        await this.ready();
        this.sendToWebview({ identifier: this.identifier, headers: this.headers });
    }

    /**
     * Handles messages from the webview.
     * @param message The message received from the webview.
     */
    protected async receiveFromWebview(message: any): Promise<void> {
        if (message.readyMessage) {
            this.resolveWebviewReady();
            await this.sendTableIdentifier();
            this.initializedEmitter.fire();
        } else if (message.action) {
            if (SelectedCellAction.isThisAction(message.action)) {
                this.selectedCell = {rowId: message.action.rowId, columnId: message.action.columnId, text: message.action.text};
                this.cellClickedEmitter.fire(this.selectedCell);
            }
        }
    }

    /**
     * Sends messages to the webview.
     * @param message The message to send.
     */
    sendToWebview(message: any) {
        this.webview.postMessage(message);
    }

    dispose() {
        this.diagramPanel.dispose();
        this.disposables.forEach(d => d.dispose());
    }

}
