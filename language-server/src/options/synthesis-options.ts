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

import { DropDownOption, TransformationOptionType, ValuedSynthesisOption } from "./option-models";

const hierarchyID = "hierarchy";
const groupingUCAsID = "groupingUCAs";
const filteringUCAsID = "filteringUCAs";

/**
 * Boolean option to toggle the hierarchy representation in the relationship graph.
 */
const hierarchicalGraphOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hierarchyID,
        name: "hierarchy",
        type: TransformationOptionType.CHECK,
        initialValue: true,
        currentValue: true,
        values: [true, false]
    },
    currentValue: true
};

const groupingOfUCAs: ValuedSynthesisOption = {
    synthesisOption: {
        id: groupingUCAsID,
        name: "Group UCAs by Control Action",
        type: TransformationOptionType.CHECK,
        initialValue: true,
        currentValue: true,
        values: [true, false]
    },
    currentValue: true
};

const filteringOfUCAs: ValuedSynthesisOption = {
    synthesisOption: {
        id: filteringUCAsID,
        name: "Filter UCAs by Control Action",
        type: TransformationOptionType.DROPDOWN,
        currentId: "all UCAs",
        availableValues: [{ displayName: "all UCAs", id: "all UCAs" }],
        initialValue: "all UCAs",
        currentValue: "all UCAs",
        values: []
    } as DropDownOption,
    currentValue: "all UCAs"
};


export class StpaSynthesisOptions {

    private options: ValuedSynthesisOption[];

    constructor() {
        this.options = [hierarchicalGraphOption, groupingOfUCAs, filteringOfUCAs];
    }

    getSynthesisOptions(): ValuedSynthesisOption[] {
        return this.options;
    }

    getHierarchy(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hierarchyID);
        return option?.currentValue;
    }

    getGroupingUCAs(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === groupingUCAsID);
        return option?.currentValue;
    }

    getFilteringUCAs(): string {
        const option = this.options.find(option => option.synthesisOption.id === filteringUCAsID);
        return option?.currentValue;
    }

    updateFilterUCAsOption(values: { displayName: string; id: string }[]) {
        const option = this.options.find(option => option.synthesisOption.id === filteringUCAsID);
        if (option) {
            (option.synthesisOption as DropDownOption).availableValues = values;
            if (!values.find(val => val.id == (option.synthesisOption as DropDownOption).currentId)) {
                (option.synthesisOption as DropDownOption).currentId = values[0].id
                option.synthesisOption.currentValue = values[0].id;
                option.synthesisOption.initialValue = values[0].id;
                option.currentValue = values[0].id;
            }
        }
    }
}
