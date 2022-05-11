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

/** @jsx html */
import { inject, injectable } from "inversify";
import { VNode } from "snabbdom";
import { html, IActionDispatcher, TYPES } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import {
    SetRenderOptionAction,
} from "./actions";
import {
    CheckOption, ChoiceOption,
} from "./components/option-inputs";
import {
    ChoiceRenderOption,
    RenderOption,
    TransformationOptionType
} from "./option-models";


/** Renderer that is capable of rendering different option models to jsx. */
@injectable()
export class OptionsRenderer {
    @inject(TYPES.IActionDispatcher) actionDispatcher: IActionDispatcher;

    /** Renders render options that are stored in the client. An example would be "show constraints" */
    renderRenderOptions(renderOptions: RenderOption[]): (VNode | "")[] | "" {
        if (renderOptions.length === 0) return "";

        return renderOptions.map((option) => {
            switch (option.type) {
                case TransformationOptionType.CHECK:
                    return (
                        <CheckOption
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            value={option.currentValue}
                            description={option.description}
                            onChange={this.handleRenderOptionChange.bind(this, option)}
                        />
                    );
                case TransformationOptionType.CHOICE:
                    return (
                        <ChoiceOption
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            value={option.currentValue}
                            description={option.description}
                            onChange={this.handleRenderOptionChange.bind(this, option)}
                            availableValues = {(option as ChoiceRenderOption).availableValues}
                        />
                    )
                default:
                    console.error("Unsupported option type for option:", option.name);
                    return "";
            }
        });
    }

    private handleRenderOptionChange(option: RenderOption, newValue: any) {
        this.actionDispatcher.dispatch(SetRenderOptionAction.create(option.id, newValue));
    }
}
