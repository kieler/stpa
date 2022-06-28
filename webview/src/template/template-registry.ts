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

import { inject, injectable } from "inversify";
import { ActionHandlerRegistry, IActionHandlerInitializer, ICommand } from "sprotty";
import { Action } from "sprotty-protocol";
import { Registry } from "../base/registry";
import { DISymbol } from "../di.symbols";
import { SendModelRendererAction, RequestWebviewTemplatesAction, SendWebviewTemplatesAction } from "./actions";
import { TemplateRenderer } from "./template-renderer";
import { vscodeApi } from 'sprotty-vscode-webview/lib/vscode-api';

/**
 * {@link Registry} that stores and manages templates provided by the server.
 *
 * Acts as an action handler that handles UpdateTemplateActions. 
 */
@injectable()
export class TemplateRegistry extends Registry implements IActionHandlerInitializer {
    readonly position = -10;

    @inject(DISymbol.TemplateRenderer) private templateRenderer: TemplateRenderer;

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(RequestWebviewTemplatesAction.KIND, this);
        registry.register(SendModelRendererAction.KIND, this);
    }

    handle(action: Action): void | Action | ICommand {
        if (RequestWebviewTemplatesAction.isThisAction(action)) {
            this.handleRequestWebviewTemps(action);
        } else if (SendModelRendererAction.isThisAction(action)) {
            this.handleSendModelRenderer(action);
        }
    }

    private handleRequestWebviewTemps(action: RequestWebviewTemplatesAction): void {
        const temps = this.templateRenderer.renderTemplates(action.templates);
        const response: SendWebviewTemplatesAction = {
            kind: SendWebviewTemplatesAction.KIND,
            templates: temps,
            responseId: action.requestId
        };
        vscodeApi.postMessage({clientId: action.clientId, action: response});
    }

    private handleSendModelRenderer(action: SendModelRendererAction) {
        this.templateRenderer.setRenderer((action as SendModelRendererAction).renderer);
        this.templateRenderer.setBounds((action as SendModelRendererAction).bounds);
    }

}