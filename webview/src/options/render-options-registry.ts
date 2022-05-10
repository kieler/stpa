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

import { injectable, postConstruct } from "inversify";
import { ICommand } from "sprotty";
import { Action, UpdateModelAction } from "sprotty-protocol";
import { Registry } from "../base/registry";
import { ResetRenderOptionsAction, SetRenderOptionAction } from "./actions";
import { ChoiceRenderOption, RenderOption, TransformationOptionType } from "./option-models";

/**
 * Diffrent options for the color style of the relationship graph.
 */
export class ColorStyleOption implements ChoiceRenderOption {
    static readonly ID: string = 'color-style';
    static readonly NAME: string = 'Color Style';
    readonly id: string = ColorStyleOption.ID;
    readonly name: string = ColorStyleOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHOICE;
    readonly availableValues: string[] = ["colorful", "standard", "print"];
    readonly initialValue: string = "colorful";
    currentValue = "colorful";
}

/**
 * Boolean option to enable and disable different forms for the STPA aspects.
 */
export class DifferentFormsOption implements RenderOption {
    static readonly ID: string = 'different-forms';
    static readonly NAME: string = 'Different Forms';
    readonly id: string = DifferentFormsOption.ID;
    readonly name: string = DifferentFormsOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = false;
    currentValue = false;
}

/**
 * Boolean option to enable and disable the visualization of the control structure.
 */
export class ShowCSOption implements RenderOption {
    static readonly ID: string = 'show-cs';
    static readonly NAME: string = 'Show Control Structure';
    readonly id: string = ShowCSOption.ID;
    readonly name: string = ShowCSOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = true;
    currentValue = true;
}

/**
 * Boolean option to enable and disable the visualization of the relationship graph.
 */
export class ShowRelationshipGraphOption implements RenderOption {
    static readonly ID: string = 'show-relations';
    static readonly NAME: string = 'Show Relationship Graph';
    readonly id: string = ShowRelationshipGraphOption.ID;
    readonly name: string = ShowRelationshipGraphOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = true;
    currentValue = true;
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


    constructor() {
        super();
        // Add available render options to this registry
        this.register(DifferentFormsOption);
        this.register(ColorStyleOption);
        
        this.register(ShowCSOption);
        this.register(ShowRelationshipGraphOption);
    }

    @postConstruct()
    init(): void {
    }


    register(Option: RenderOptionType): void {
        this._renderOptions.set(Option.ID, new Option())
    }

    handle(action: Action): void | Action | ICommand {
        if (SetRenderOptionAction.isThisAction(action)) {
            const option = this._renderOptions.get(action.id);

            if (!option) return;

            option.currentValue = action.value;
            this.notifyListeners();

        } else if (ResetRenderOptionsAction.isThisAction(action)) {
            this._renderOptions.forEach((option) => {
                option.currentValue = option.initialValue;
            });
            this.notifyListeners();

        }
        return UpdateModelAction.create([], { animate: false, cause: action })
    }

    get allRenderOptions(): RenderOption[] {
        return Array.from(this._renderOptions.values());
    }

    getValue(Option: RenderOptionType): any | undefined {
        return this._renderOptions.get(Option.ID)?.currentValue;
    }

    getValueOrDefault(Option: RenderOptionDefault): any {
        return this.getValue(Option) ?? Option.DEFAULT
    }
}
