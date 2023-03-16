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

import { hasOwnProperty, isActionMessage, SelectAction } from 'sprotty-protocol';
import { SprottyLspWebview } from "sprotty-vscode/lib/lsp";
import * as vscode from 'vscode';
import { SendConfigAction } from './actions';

export class StpaLspWebview extends SprottyLspWebview {

    protected receiveFromWebview(message: any): Promise<boolean> {
        // TODO: for multiple language support here the current language muste be determined
        if (isRenderOptionsRegistryReadyMessage(message)) {
            this.sendConfigValues();
        } else if (isActionMessage(message)) {
            switch (message.action.kind) {
                case SendConfigAction.KIND:
                    this.updateConfigValues(message.action as SendConfigAction);
                    break;
                case SelectAction.KIND:
                    this.handleSelectAction(message.action as SelectAction);
                    break;
            }

        }
        return super.receiveFromWebview(message);
    }
    
    /**
     * Handles a SelectAction by sending the ID of the selected element to the language server.
     * @param action The SelectAction.
     */
    protected handleSelectAction(action: SelectAction): void {
        // the uri string must be desrialized first, since sprotty serializes it and langium does not
        let uriString = this.diagramIdentifier.uri.toString();
        const match = uriString.match(/file:\/\/\/([a-z]):/i);
        if (match) {
            uriString = 'file:///' + match[1] + '%3A' + uriString.substring(match[0].length);
        }
        // send ID of the first selected element to the language server to highlight the textual definition in the editor
        this.languageClient.sendNotification('diagram/selected', {label: action.selectedElementsIDs[0], uri: uriString});
    }

    /**
     * Sends the config option values to the webview
     */
    protected sendConfigValues(): void {
        const renderOptions: { id: string, value: any; }[] = [];
        const configOptions = vscode.workspace.getConfiguration('pasta');
        renderOptions.push({ id: "colorStyle", value: configOptions.get("colorStyle") });
        renderOptions.push({ id: "differentForms", value: configOptions.get("differentForms") });

        this.dispatch({ kind: SendConfigAction.KIND, options: renderOptions } as SendConfigAction);
    }

    protected updateConfigValues(action: SendConfigAction): void {
        const configOptions = vscode.workspace.getConfiguration('pasta');
        action.options.forEach(element => configOptions.update(element.id, element.value));
    }
}

interface RenderOptionsRegistryReadyMessage {
    optionRegistryReadyMessage: string;
}

function isRenderOptionsRegistryReadyMessage(object: unknown): object is RenderOptionsRegistryReadyMessage {
    return hasOwnProperty(object, 'optionRegistryReadyMessage');
}
