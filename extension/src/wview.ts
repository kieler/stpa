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
import { hasOwnProperty,isActionMessage } from 'sprotty-protocol';
import { SprottyLspWebview } from "sprotty-vscode/lib/lsp";
import { SendConfigAction } from './actions';

export class StpaLspWebview extends SprottyLspWebview {

    protected receiveFromWebview(message: any): Promise<boolean> {
        // TODO: for multiple language support here the current language muste be determined
        if (isRenderOptionsRegistryReadyMessage(message)) {
            this.sendConfigValues();
        } else if (isActionMessage(message) && message.action.kind === SendConfigAction.KIND) {
            this.updateConfigValues(message.action as SendConfigAction);
        }
        return super.receiveFromWebview(message);
    }

    /**
     * Sends the config option values to the webview
     */
    protected sendConfigValues() {
        const renderOptions: { id: string, value: any; }[] = [];
        const configOptions = vscode.workspace.getConfiguration('stpa');
        renderOptions.push({ id: "colorStyle", value: configOptions.get("colorStyle") });
        renderOptions.push({ id: "differentForms", value: configOptions.get("differentForms") });

        this.dispatch({ kind: SendConfigAction.KIND, options: renderOptions } as SendConfigAction);
    }

    protected updateConfigValues(action: SendConfigAction) {
        const configOptions = vscode.workspace.getConfiguration('stpa');
        action.options.forEach(element => configOptions.update(element.id, element.value))
    }
}

interface RenderOptionsRegistryReadyMessage {
    optionRegistryReadyMessage: string;
}

function isRenderOptionsRegistryReadyMessage(object: unknown): object is RenderOptionsRegistryReadyMessage {
    return hasOwnProperty(object, 'optionRegistryReadyMessage');
}
