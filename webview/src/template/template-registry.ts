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
import { SendModelRendererAction, UpdateTemplatesAction } from "./actions";
import { Template } from "./template-models";
import { TemplateRenderer } from "./template-renderer";

/**
 * {@link Registry} that stores and manages templates provided by the server.
 *
 * Acts as an action handler that handles UpdateTemplateActions. 
 */
@injectable()
export class TemplateRegistry extends Registry implements IActionHandlerInitializer {
    readonly position = -10;

    private _clientId = "";

    get clientId(): string {
        return this._clientId;
    }

    @inject(DISymbol.TemplateRenderer) private templateRenderer: TemplateRenderer;
    
    private _templates: Template[] = [];

    get templates(): Template[] {
        return this._templates;
    }
    
    hasTemplateOptions(): boolean {
        return this._templates.length !== 0;
    }

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(UpdateTemplatesAction.KIND, this);
        registry.register(SendModelRendererAction.KIND, this);
    }

    handle(action: Action): void | Action | ICommand {
        if (UpdateTemplatesAction.isThisAction(action)) {
            this.handleUpdateOptions(action);
        } else if (SendModelRendererAction.isThisAction(action)) {
            this.handleSendModelRenderer(action);
        }
    }

    private handleUpdateOptions(action: UpdateTemplatesAction): void {
        this._clientId = action.clientId;
        this._templates = action.templates;
        this.notifyListeners();
    }

    private handleSendModelRenderer(action: SendModelRendererAction) {
        this.templateRenderer.setRenderer((action as SendModelRendererAction).renderer);
        this.templateRenderer.setBounds((action as SendModelRendererAction).bounds);
    }

}