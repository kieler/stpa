/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2022 by
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

import { inject, injectable, postConstruct } from "inversify";
import { ICommand } from "sprotty";
import { Action, UpdateModelAction } from "sprotty-protocol";
import { ActionNotification } from 'sprotty-vscode-protocol';
import { VsCodeMessenger } from "sprotty-vscode-webview/lib/services";
import { HOST_EXTENSION } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';
import { Registry } from "../base/registry";
import { ResetRenderOptionsAction, SendConfigAction, SetRenderOptionAction } from "./actions";
import { ChoiceRenderOption, RenderOption, TransformationOptionType } from "./option-models";

/**
 * Diffrent options for the color style of the relationship graph.
 */
export class ColorStyleOption implements ChoiceRenderOption {
    static readonly ID: string = 'colorStyle';
    static readonly NAME: string = 'Color Style';
    readonly id: string = ColorStyleOption.ID;
    readonly name: string = ColorStyleOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHOICE;
    readonly availableValues: string[] = ["colorful", "standard", "black & white", "fewer colors"];
    readonly initialValue: string = "colorful";
    currentValue = "colorful";
}

/**
 * Boolean option to enable and disable different forms for the STPA aspects.
 */
export class DifferentFormsOption implements RenderOption {
    static readonly ID: string = 'differentForms';
    static readonly NAME: string = 'Different Forms';
    readonly id: string = DifferentFormsOption.ID;
    readonly name: string = DifferentFormsOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = false;
    currentValue = false;
}

export interface RenderOptionType {
    readonly ID: string,
    readonly NAME: string,
    new(): RenderOption,
}

export interface RenderOptionDefault extends RenderOptionType {
    readonly DEFAULT: any,
}

/** {@link Registry} that stores and updates different render options. */
@injectable()
export class RenderOptionsRegistry extends Registry {
    private _renderOptions: Map<string, RenderOption> = new Map();

    @inject(VsCodeMessenger) protected messenger: Messenger;

    constructor() {
        super();
        // Add available render options to this registry
        this.register(DifferentFormsOption);
        this.register(ColorStyleOption);
    }

    @postConstruct()
    init(): void {
        this.messenger.sendNotification(ActionNotification, HOST_EXTENSION, {clientId: "", action: {kind: "optionRegistryReadyMessage"}});
    }

    register(Option: RenderOptionType): void {
        this._renderOptions.set(Option.ID, new Option());
    }

    handle(action: Action): void | Action | ICommand {
        if (SetRenderOptionAction.isThisAction(action)) {
            const option = this._renderOptions.get(action.id);
            if (!option) {return;}
            option.currentValue = action.value;
            const sendAction = { kind: SendConfigAction.KIND, options: [{ id: action.id, value: action.value }] };
            this.messenger.sendNotification(ActionNotification, HOST_EXTENSION, {clientId: "", action: sendAction});
            this.notifyListeners();

        } else if (ResetRenderOptionsAction.isThisAction(action)) {
            this._renderOptions.forEach((option) => {
                option.currentValue = option.initialValue;
            });
            this.notifyListeners();

        } else if (SendConfigAction.isThisAction(action)) {
            action.options.forEach(element => {
                const option = this._renderOptions.get(element.id);
                if (!option) {return;}
                option.currentValue = element.value;
            });
            this.notifyListeners();
        } 
        return UpdateModelAction.create([], { animate: false, cause: action });
    }

    get allRenderOptions(): RenderOption[] {
        return Array.from(this._renderOptions.values());
    }

    getValue(Option: RenderOptionType): any | undefined {
        return this._renderOptions.get(Option.ID)?.currentValue;
    }

    getValueOrDefault(Option: RenderOptionDefault): any {
        return this.getValue(Option) ?? Option.DEFAULT;
    }
}
