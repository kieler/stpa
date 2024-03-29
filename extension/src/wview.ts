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
import { LspWebviewEndpoint } from "sprotty-vscode/lib/lsp";
import * as vscode from "vscode";
import { CutSetAnalysisAction, MinimalCutSetAnalysisAction, SendConfigAction } from "./actions";

export class StpaLspWebview extends LspWebviewEndpoint {
    receiveAction(message: any): Promise<void> {
        if (isActionMessage(message)) {
            switch (message.action.kind) {
                case "optionRegistryReadyMessage":
                    this.sendConfigValues();
                case SendConfigAction.KIND:
                    this.updateConfigValues(message.action as SendConfigAction);
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
     * Sends the config option values to the webview
     */
    protected sendConfigValues(): void {
        const renderOptions: { id: string; value: any }[] = [];
        const configOptions = vscode.workspace.getConfiguration("pasta");
        renderOptions.push({ id: "colorStyle", value: configOptions.get("colorStyle") });
        renderOptions.push({ id: "differentForms", value: configOptions.get("differentForms") });

        this.sendAction({ kind: SendConfigAction.KIND, options: renderOptions } as SendConfigAction);
    }

    /**
     * Updates the configuration of the PASTA extension.
     * @param action The action containing the configuration options.
     */
    protected updateConfigValues(action: SendConfigAction): void {
        const configOptions = vscode.workspace.getConfiguration("pasta");
        action.options.forEach((element) => configOptions.update(element.id, element.value));
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
