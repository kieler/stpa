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

import { DropDownOption, RangeOption, SynthesisOption, TransformationOptionType, ValuedSynthesisOption } from "../options/option-models";

const hierarchyID = "hierarchy";
const modelOrderID = "modelOrder";
const groupingUCAsID = "groupingUCAs";
const filteringUCAsID = "filteringUCAs";

const hideSysConsID = "hideSysCons";
const hideRespsID = "hideResps";
const hideContConsID = "hideContCons";
const hideScenariosID = "hideScenarios";

const showLabelsID = "showLabels";
const labelManagementID = "labelManagement";
const labelShorteningWidthID = "labelShorteningWidth";

const layoutCategoryID = "layoutCategory";
const filterCategoryID = "filterCategory";


const layoutCategory: SynthesisOption = {
    id: layoutCategoryID,
    name: "Layout",
    type: TransformationOptionType.CATEGORY,
    initialValue: 0,
    currentValue: 0,
    values: []
};

const layoutCategoryOption: ValuedSynthesisOption = {
    synthesisOption: layoutCategory,
    currentValue: 0
};

const filterCategory: SynthesisOption = {
    id: filterCategoryID,
    name: "Filtering",
    type: TransformationOptionType.CATEGORY,
    initialValue: 0,
    currentValue: 0,
    values: []
};

const filterCategoryOption: ValuedSynthesisOption = {
    synthesisOption: filterCategory,
    currentValue: 0
};

/**
 * Boolean option to toggle the hierarchy representation in the relationship graph.
 */
const hierarchicalGraphOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hierarchyID,
        name: "Hierarchy",
        type: TransformationOptionType.CHECK,
        initialValue: true,
        currentValue: true,
        values: [true, false],
        category: layoutCategory
    },
    currentValue: true
};

const modelOrderOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: modelOrderID,
        name: "Model Order",
        type: TransformationOptionType.CHECK,
        initialValue: true,
        currentValue: true,
        values: [true, false],
        category: layoutCategory
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
        initialValue: "No grouping",
        currentValue: "No grouping",
        values: ["No grouping", "Group by Control Action", "Group by System Component"],
        category: layoutCategory
    },
    currentValue: "No grouping"
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
        values: [],
        category: filterCategory
    } as DropDownOption,
    currentValue: "all UCAs"
};

/**
 * Boolean option to toggle the visualization of system-level constraints.
 */
const hideSysConsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideSysConsID,
        name: "Hide system-level constraints",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory
    },
    currentValue: false
};

/**
 * Boolean option to toggle the visualization of responsibilities.
 */
const hideRespsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideRespsID,
        name: "Hide responsibilities",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory
    },
    currentValue: false
};

/**
 * Boolean option to toggle the visualization of controller constraints.
 */
const hideContConsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideContConsID,
        name: "Hide controller constraints",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory
    },
    currentValue: false
};

/**
 * Boolean option to toggle the visualization of loss scenarios.
 */
const hideScenariosOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideScenariosID,
        name: "Hide loss scenarios",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory
    },
    currentValue: false
};

const labelShorteningWidthOption: ValuedSynthesisOption = {
    synthesisOption : {
        id: labelShorteningWidthID,
        name: "Shortening Width",
        type: TransformationOptionType.RANGE,
        initialValue: 30,
        currentValue: 30,
        range: {first: 0, second: 100},
        stepSize: 1,
        values: [],
        category: layoutCategory
    } as RangeOption,
    currentValue: 30
};

const labelManagementOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: labelManagementID,
        name: "Node Label Management",
        type: TransformationOptionType.CHOICE,
        initialValue: "No Labels",
        currentValue: "No Labels",
        values: ["Original Labels", "Wrapping", "Truncate", "No Labels"],
        category: layoutCategory
    },
    currentValue: "No Labels"
};

const showLabelsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: showLabelsID,
        name: "Show Labels of",
        type: TransformationOptionType.DROPDOWN,
        currentId: "all",
        availableValues: [{ displayName: "all", id: "all" },
        { displayName: "Losses", id: "losses" },
        { displayName: "Hazards", id: "hazards" },
        { displayName: "System Constraints", id: "systemConstraints" },
        { displayName: "Responsibilities", id: "responsibilities" },
        { displayName: "UCAs", id: "ucas" },
        { displayName: "Controller Constraints", id: "controllerConstraints" },
        { displayName: "Scenarios", id: "scenarios" },
        { displayName: "Safety Constraints", id: "safetyConstraints" },
        { displayName: "Automatic", id: "automatic" }],
        initialValue: "all",
        currentValue: "all",
        values: [],
        category: layoutCategory
    } as DropDownOption,
    currentValue: "all"
};

export enum labelManagementValue {
    ORIGINAL,
    WRAPPING,
    TRUNCATE,
    NO_LABELS
}

export enum showLabelsValue {
    ALL,
    LOSSES,
    HAZARDS,
    SYSTEM_CONSTRAINTS,
    UCAS,
    RESPONSIBILITIES,
    CONTROLLER_CONSTRAINTS,
    SCENARIOS,
    SAFETY_CONSTRAINTS,
    AUTOMATIC
}
export class StpaSynthesisOptions {

    private options: ValuedSynthesisOption[];

    constructor() {
        this.options = [
            layoutCategoryOption, filterCategoryOption,
            hierarchicalGraphOption, modelOrderOption, groupingOfUCAs, filteringOfUCAs,
            hideSysConsOption, hideRespsOption, hideContConsOption, hideScenariosOption,
            labelManagementOption, labelShorteningWidthOption, showLabelsOption
        ];
    }

    getSynthesisOptions(): ValuedSynthesisOption[] {
        return this.options;
    }

    getShowLabels(): showLabelsValue {
        const option = this.options.find(option => option.synthesisOption.id === showLabelsID);
        switch (option?.currentValue) {
            case "all": return showLabelsValue.ALL;
            case "losses": return showLabelsValue.LOSSES;
            case "hazards": return showLabelsValue.HAZARDS;
            case "systemConstraints": return showLabelsValue.SYSTEM_CONSTRAINTS;
            case "responsibilities": return showLabelsValue.RESPONSIBILITIES;
            case "ucas": return showLabelsValue.UCAS;
            case "controllerConstraints": return showLabelsValue.CONTROLLER_CONSTRAINTS;
            case "scenarios": return showLabelsValue.SCENARIOS;
            case "safetyConstraints": return showLabelsValue.SAFETY_CONSTRAINTS;
            case "automatic": return showLabelsValue.AUTOMATIC;
        }
        return option?.currentValue;
    }

    getLabelManagement(): labelManagementValue {
        const option = this.options.find(option => option.synthesisOption.id === labelManagementID);
        switch (option?.currentValue) {
            case "Original Labels": return labelManagementValue.ORIGINAL;
            case "Wrapping": return labelManagementValue.WRAPPING;
            case "Truncate": return labelManagementValue.TRUNCATE;
            case "No Labels": return labelManagementValue.NO_LABELS;
        }
        return option?.currentValue;
    }

    getLabelShorteningWidth(): number {
        const option = this.options.find(option => option.synthesisOption.id === labelShorteningWidthID);
        return option?.currentValue;
    }

    getHierarchy(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hierarchyID);
        return option?.currentValue;
    }

    getGroupingUCAs(): groupValue {
        const option = this.options.find(option => option.synthesisOption.id === groupingUCAsID);
        switch (option?.currentValue) {
            case "No grouping": return groupValue.NO_GROUPING;
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
