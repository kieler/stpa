/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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
import { VsCodeApi } from "sprotty-vscode-webview/lib/services";
import { Registry } from "../base/registry";
import {
    SetSynthesisOptionsAction,
    UpdateOptionsAction,
} from "./actions";
import {
    SynthesisOption,
} from "./option-models";

/**
 * {@link Registry} that stores and manages STPA-DSL options provided by the server.
 *
 * Acts as an action handler that handles UpdateOptionsActions and modifications
 * to the Options. Changes are synchronized with the server.
 */
@injectable()
export class OptionsRegistry extends Registry implements IActionHandlerInitializer {

    @inject(VsCodeApi) private vscodeApi: VsCodeApi;

    private _clientId = "";
    private _synthesisOptions: SynthesisOption[] = [];

    get clientId(): string {
        return this._clientId;
    }

    get valuedSynthesisOptions(): SynthesisOption[] {
        return this._synthesisOptions;
    }

    /** Returns `true` when the registry contains options and is therefore not empty. */
    hasOptions(): boolean {
        return (
            this._synthesisOptions.length !== 0
        );
    }

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(UpdateOptionsAction.KIND, this);
        registry.register(SetSynthesisOptionsAction.KIND, this);
    }

    handle(action: Action): void | Action | ICommand {
        if (UpdateOptionsAction.isThisAction(action)) {
            this.handleUpdateOptions(action);
        } else if (SetSynthesisOptionsAction.isThisAction(action)) {
            this.handleSetSynthesisOptions(action);
        }
    }

    private handleUpdateOptions(action: UpdateOptionsAction): void {
        this._clientId = action.clientId;

        // Transform valued synthesis options to synthesis options by setting their current value
        this._synthesisOptions = action.valuedSynthesisOptions
            .map<SynthesisOption>((valuedOption) => ({
                ...valuedOption.synthesisOption,
                currentValue:
                    valuedOption.currentValue ?? valuedOption.synthesisOption.initialValue,
            }));

        this.notifyListeners();
    }

    private handleSetSynthesisOptions(action: SetSynthesisOptionsAction) {
        // Optimistic update. Replaces all changed options with the new options
        this._synthesisOptions = this._synthesisOptions.map(
            (option) => action.options.find((newOpt) => newOpt.id === option.id) ?? option
        );
        this.notifyListeners();

        this.vscodeApi.postMessage({clientId: this._clientId, action: action});
    }

}
