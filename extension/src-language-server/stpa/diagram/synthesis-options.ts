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

import { DropDownOption, TransformationOptionType, ValuedSynthesisOption } from "../../options/option-models";

const hierarchyID = "hierarchy";
const groupingUCAsID = "groupingUCAs";
const filteringUCAsID = "filteringUCAs";
const hideSysConsID = "hideSysCons";
const hideRespsID = "hideResps";
const hideContConsID = "hideContCons";
const hideScenariosID = "hideScenarios";

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

export enum groupValue {
    NO_GROUPING,
    CONTROL_ACTION,
    SYSTEM_COMPONENT
}

/**
 * Option to determine the grouping of UCAs.
 * It can be no grouping, grouping by control action or grouping by system component.
 */
const groupingOfUCAs: ValuedSynthesisOption = {
    synthesisOption: {
        id: groupingUCAsID,
        name: "Group UCAs",
        type: TransformationOptionType.CHOICE,
        initialValue: "no grouping",
        currentValue: "no grouping",
        values: ["no grouping", "Group by Control Action", "Group by System Component"]
    },
    currentValue: "no grouping"
};

/**
 * Option to filter the UCAs based on their control action
 */
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

/**
 * Boolean option to toggle the visualization of system-level constraints.
 */
const hideSysConsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideSysConsID,
        name: "hide system-level constraints",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false]
    },
    currentValue: false
};

/**
 * Boolean option to toggle the visualization of responsibilities.
 */
const hideRespsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideRespsID,
        name: "hide responsibilities",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false]
    },
    currentValue: false
};

/**
 * Boolean option to toggle the visualization of controller constraints.
 */
const hideContConsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideContConsID,
        name: "hide controller constraints",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false]
    },
    currentValue: false
};

/**
 * Boolean option to toggle the visualization of loss scenarios.
 */
const hideScenariosOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideScenariosID,
        name: "hide loss scenarios",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false]
    },
    currentValue: false
};

export class StpaSynthesisOptions {

    private options: ValuedSynthesisOption[];

    constructor() {
        this.options = [
            hierarchicalGraphOption, groupingOfUCAs, filteringOfUCAs,
            hideSysConsOption, hideRespsOption, hideContConsOption, hideScenariosOption
        ];
    }

    getSynthesisOptions(): ValuedSynthesisOption[] {
        return this.options;
    }

    getHierarchy(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hierarchyID);
        return option?.currentValue;
    }

    getGroupingUCAs(): groupValue {
        const option = this.options.find(option => option.synthesisOption.id === groupingUCAsID);
        switch (option?.currentValue) {
            case "no grouping": return groupValue.NO_GROUPING;
            case "Group by Control Action": return groupValue.CONTROL_ACTION;
            case "Group by System Component": return groupValue.SYSTEM_COMPONENT;
        }
        return option?.currentValue;
    }

    getFilteringUCAs(): string {
        const option = this.options.find(option => option.synthesisOption.id === filteringUCAsID);
        return option?.currentValue;
    }

    getHideSysCons(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideSysConsID);
        return option?.currentValue;
    }

    getHideRespsCons(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideRespsID);
        return option?.currentValue;
    }

    getHideContCons(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideContConsID);
        return option?.currentValue;
    }

    getHideScenarios(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideScenariosID);
        return option?.currentValue;
    }

    /**
     * Updates the filterUCAs option with the availabe cotrol actions.
     * @param values The currently avaiable control actions.
     */
    updateFilterUCAsOption(values: { displayName: string; id: string; }[]): void {
        const option = this.options.find(option => option.synthesisOption.id === filteringUCAsID);
        if (option) {
            (option.synthesisOption as DropDownOption).availableValues = values;
            // if the last selected control action is not available anymore, 
            // set the option to the first control action of the new list
            if (!values.find(val => val.id === (option.synthesisOption as DropDownOption).currentId)) {
                (option.synthesisOption as DropDownOption).currentId = values[0].id;
                option.synthesisOption.currentValue = values[0].id;
                option.synthesisOption.initialValue = values[0].id;
                option.currentValue = values[0].id;
            }
        }
    }
}
