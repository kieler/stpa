/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2023 by
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

import { isActionMessage, SelectAction } from "sprotty-protocol";
import { LspWebviewEndpoint, LspWebviewEndpointOptions } from "sprotty-vscode/lib/lsp";
import * as vscode from "vscode";
import { CutSetAnalysisAction, MinimalCutSetAnalysisAction, UpdateStorageAction } from "./actions";
import { StorageService } from "./storage-service";

export class StpaLspWebview extends LspWebviewEndpoint {
    // The storage service to store the configuration options.
    readonly storage: StorageService;

    constructor(options: LspWebviewEndpointOptions, storage: StorageService) {
        super(options);
        this.storage = storage;
    }

    receiveAction(message: any): Promise<void> {
        if (isActionMessage(message)) {
            switch (message.action.kind) {
                case "optionRegistryReadyMessage":
                    this.sendStorageValues();
                    break;
                case UpdateStorageAction.KIND:
                    this.updateStorageValues(message.action as UpdateStorageAction);
                    break;
                case SelectAction.KIND:
                    this.handleSelectAction(message.action as SelectAction);
                    break;
                case CutSetAnalysisAction.KIND:
                    this.handleCutSetAnalysisAction(message.action as CutSetAnalysisAction);
                    break;
                case MinimalCutSetAnalysisAction.KIND:
                    this.handleMinimalCutSetAnalysisAction(message.action as MinimalCutSetAnalysisAction);
                    break;
            }
        }
        return super.receiveAction(message);
    }

    /**
     * Handles a SelectAction by sending the ID of the selected element to the language server.
     * @param action The SelectAction.
     */
    protected handleSelectAction(action: SelectAction): void {
        // the uri string must be deserialized first, since sprotty serializes it and langium does not
        const uriString = this.deserializeUriOfDiagramIdentifier();
        if (uriString !== "") {
            // send ID of the first selected element to the language server to highlight the textual definition in the editor
            this.languageClient.sendNotification("diagram/selected", {
                label: action.selectedElementsIDs[0],
                uri: uriString,
            });
        }
    }

    /**
     * Sends the storage option values to the webview
     */
    protected sendStorageValues(): void {
        const renderOptions: Record<string, any> = this.storage.getItem("renderOptions");
        if (renderOptions) {
            this.sendAction({
                kind: UpdateStorageAction.KIND,
                group: "renderOptions",
                options: renderOptions,
            } as UpdateStorageAction);
        }
    }

    /**
     * Updates the storage of the PASTA extension.
     * @param action The action containing the configuration options.
     */
    protected updateStorageValues(action: UpdateStorageAction): void {
        let group = this.storage.getItem(action.group);
        if (!group) {
            group = {};
        }
        Object.entries(action.options).forEach(([key, value]) => {
            group[key] = value;
        });
        this.storage.setItem(action.group, group);
    }

    /**
     * Executes the cut set analysis for the given start ID.
     * @param action The action containing the start ID.
     */
    protected handleCutSetAnalysisAction(action: CutSetAnalysisAction): void {
        const uriString = this.deserializeUriOfDiagramIdentifier();
        if (uriString !== "") {
            const uri = vscode.Uri.parse(uriString);
            vscode.commands.executeCommand("pasta.fta.cutSets", uri, action.startId);
        }
    }

    /**
     * Executes the minimal cut set analysis for the given start ID.
     * @param action The action containing the start ID.
     */
    protected handleMinimalCutSetAnalysisAction(action: MinimalCutSetAnalysisAction): void {
        const uriString = this.deserializeUriOfDiagramIdentifier();
        if (uriString !== "") {
            const uri = vscode.Uri.parse(uriString);
            vscode.commands.executeCommand("pasta.fta.minimalCutSets", uri, action.startId);
        }
    }

    /**
     * Deserializes the URI of the diagram identifier.
     * @returns the deserialized URI of the diagram identifier.
     */
    protected deserializeUriOfDiagramIdentifier(): string {
        if (this.diagramIdentifier) {
            let uriString = this.diagramIdentifier.uri.toString();
            const match = uriString.match(/file:\/\/\/([a-z]):/i);
            if (match) {
                uriString = "file:///" + match[1] + "%3A" + uriString.substring(match[0].length);
            }
            return uriString;
        }
        return "";
    }
}
