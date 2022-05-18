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
import { UpdateOptionsAction } from "../options/actions";
import { Template } from "../options/option-models";
import { OptionsRenderer } from "../options/options-renderer";
import { SendModelRendererAction } from "./actions";

/**
 * {@link Registry} that stores and manages STPA-DSL templates provided by the server.
 *
 * Acts as an action handler that handles UpdateOptionsActions. 
 */
@injectable()
export class TemplateRegistry extends Registry implements IActionHandlerInitializer {

    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;
    
    private _templates: Template[] = [];

    get templates(): Template[] {
        return this._templates;
    }
    
    hasTemplateOptions(): boolean {
        return this._templates.length !== 0;
    }

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(UpdateOptionsAction.KIND, this);
        registry.register(SendModelRendererAction.KIND, this);
    }

    handle(action: Action): void | Action | ICommand {
        if (UpdateOptionsAction.isThisAction(action)) {
            this.handleUpdateOptions(action);
        } else if (SendModelRendererAction.isThisAction(action)) {
            this.handleSendModelRenderer(action);
        }
    }

    private handleUpdateOptions(action: UpdateOptionsAction): void {
        this._templates = action.templates.map<Template>(temp => ({
            graph: temp.graph,
            code: temp.code
        }));
        this.notifyListeners();
    }

    private handleSendModelRenderer(action: SendModelRendererAction) {
        this.optionsRenderer.setRenderer((action as SendModelRendererAction).renderer);
        this.optionsRenderer.setBounds((action as SendModelRendererAction).bounds);
    }

}