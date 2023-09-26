/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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

import { DropDownOption, TransformationOptionType, ValuedSynthesisOption } from "../options/option-models";
import { SynthesisOptions } from "../synthesis-options";

const cutSetsID = "cutSets";

const cutSets: ValuedSynthesisOption = {
    synthesisOption: {
        id: cutSetsID,
        name: "Highlight Cut Set",
        type: TransformationOptionType.DROPDOWN,
        currentId: "---",
        availableValues: [{ displayName: "---", id: "noCutSet" }],
        initialValue: "---",
        currentValue: "---",
        values: [],
    } as DropDownOption,
    currentValue: "---",
};

export class FtaSynthesisOptions extends SynthesisOptions {
    constructor() {
        super();
        this.options = [cutSets];
    }

    /**
     * Updates the cutSets option with the availabe cut sets.
     * @param values The currently avaiable cut sets.
     */
    updateCutSetsOption(values: { displayName: string; id: string }[]): void {
        const option = this.getOption(cutSetsID);
        if (option) {
            (option.synthesisOption as DropDownOption).availableValues = [
                { displayName: "---", id: "noCutSet" },
                ...values,
            ];
            // if the last selected cut set is not available anymore,
            // set the option to the first value of the new list
            if (!values.find((val) => val.id === (option.synthesisOption as DropDownOption).currentId)) {
                (option.synthesisOption as DropDownOption).currentId = values[0].id;
                option.synthesisOption.currentValue = values[0].id;
                option.synthesisOption.initialValue = values[0].id;
                option.currentValue = values[0].id;
            }
        }
    }

    setCutSets(value: string): void {
        const option = this.options.find((option) => option.synthesisOption.id === cutSetsID);
        if (option) {
            option.currentValue = value;
            option.synthesisOption.currentValue = value;
            (option.synthesisOption as DropDownOption).currentId = value;
        }
    }

    getCutSets(): string {
        return this.getOption(cutSetsID)?.currentValue;
    }
}
