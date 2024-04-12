/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2024 by
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

import {
    DropDownOption,
    SynthesisOption,
    TransformationOptionType,
    ValuedSynthesisOption,
} from "../../options/option-models";
import { SynthesisOptions, layoutCategory } from "../../synthesis-options";

const hierarchyID = "hierarchy";
const groupingUCAsID = "groupingUCAs";
export const filteringUCAsID = "filteringUCAs";

const hideSysConsID = "hideSysCons";
const hideRespsID = "hideResps";
const hideContConsID = "hideContCons";
const hideScenariosID = "hideScenarios";
const hideScenariosWithHazardID = "hideScenariosWithHazards";
const hideUCAsID = "hideUCAs";
const hideSafetyConstraintsID = "hideSafetyConstraints";

const showLabelsID = "showLabels";

const filterCategoryID = "filterCategory";

const showControlStructureID = "showControlStructure";
const showProcessModelsID = "showProcessModels";
const showRelationshipGraphID = "showRelationshipGraph";

/**
 * Category for filtering options.
 */
const filterCategory: SynthesisOption = {
    id: filterCategoryID,
    name: "Filtering",
    type: TransformationOptionType.CATEGORY,
    initialValue: 0,
    currentValue: 0,
    values: [],
};

/**
 * The option for the filter category.
 */
const filterCategoryOption: ValuedSynthesisOption = {
    synthesisOption: filterCategory,
    currentValue: 0,
};

/**
 * Boolean option to toggle the visualization of the control structure.
 */
const showControlStructureOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: showControlStructureID,
        name: "Show Control Structure",
        type: TransformationOptionType.CHECK,
        initialValue: true,
        currentValue: true,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: true,
};

/**
 * Boolean option to toggle the visualization of the process model of controllers.
 */
const showProcessModelsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: showProcessModelsID,
        name: "Show Process Models",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: false,
};

/**
 * Boolean option to toggle the visualization of the relationship graph.
 */
const showRelationshipGraphOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: showRelationshipGraphID,
        name: "Show Relationship Graph",
        type: TransformationOptionType.CHECK,
        initialValue: true,
        currentValue: true,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: true,
};

/**
 * Boolean option to toggle the visualization of UCAs.
 */
const hideUCAsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideUCAsID,
        name: "Hide UCAs",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: false,
};

/**
 * Boolean option to toggle the visualization of safety constraints.
 */
const hideSafetyConstraintsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideSafetyConstraintsID,
        name: "Hide Safety Constraints",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: false,
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
        category: layoutCategory,
    },
    currentValue: true,
};

/**
 * Values for the grouping of UCAs.
 */
export enum groupValue {
    NO_GROUPING,
    CONTROL_ACTION,
    SYSTEM_COMPONENT,
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
        initialValue: "No Grouping",
        currentValue: "No grouping",
        values: ["No Grouping", "Group by Control Action", "Group by System Component"],
        category: layoutCategory,
    },
    currentValue: "No Grouping",
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
        category: filterCategory,
    } as DropDownOption,
    currentValue: "all UCAs",
};

/**
 * Boolean option to toggle the visualization of system-level constraints.
 */
const hideSysConsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideSysConsID,
        name: "Hide System-level Constraints",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: false,
};

/**
 * Boolean option to toggle the visualization of responsibilities.
 */
const hideRespsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideRespsID,
        name: "Hide Responsibilities",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: false,
};

/**
 * Boolean option to toggle the visualization of controller constraints.
 */
const hideContConsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideContConsID,
        name: "Hide Controller Constraints",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: false,
};

/**
 * Boolean option to toggle the visualization of loss scenarios.
 */
const hideScenariosOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideScenariosID,
        name: "Hide Loss Scenarios",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: false,
};

/**
 * Boolean option to toggle the visualization of loss scenarios that are not associated with a UCA.
 */
const hideScenariosWithHazardsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideScenariosWithHazardID,
        name: "Hide Loss Scenarios Without UCAs",
        type: TransformationOptionType.CHECK,
        initialValue: false,
        currentValue: false,
        values: [true, false],
        category: filterCategory,
    },
    currentValue: false,
};

/**
 * Option to filter the node labels based on the aspect of the node.
 */
const showLabelsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: showLabelsID,
        name: "Show Labels of",
        type: TransformationOptionType.DROPDOWN,
        currentId: "losses",
        availableValues: [
            { displayName: "All", id: "all" },
            { displayName: "Losses", id: "losses" },
            { displayName: "Hazards", id: "hazards" },
            { displayName: "System Constraints", id: "systemConstraints" },
            { displayName: "Responsibilities", id: "responsibilities" },
            { displayName: "UCAs", id: "ucas" },
            { displayName: "Controller Constraints", id: "controllerConstraints" },
            { displayName: "Scenarios", id: "scenarios" },
            { displayName: "Safety Constraints", id: "safetyConstraints" },
            { displayName: "Automatic", id: "automatic" },
        ],
        initialValue: "losses",
        currentValue: "losses",
        values: [],
        category: layoutCategory,
    } as DropDownOption,
    currentValue: "losses",
};

/**
 * Values for filtering the node labels.
 */
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
    AUTOMATIC,
}

export class StpaSynthesisOptions extends SynthesisOptions {
    constructor() {
        super();
        this.options.push(
            ...[
                filterCategoryOption,
                hierarchicalGraphOption,
                groupingOfUCAs,
                filteringOfUCAs,
                hideSysConsOption,
                hideRespsOption,
                hideUCAsOption,
                hideContConsOption,
                hideScenariosOption,
                hideScenariosWithHazardsOption,
                hideSafetyConstraintsOption,
                showLabelsOption,
                showControlStructureOption,
                showProcessModelsOption,
                showRelationshipGraphOption,
            ]
        );
    }

    getShowLabels(): showLabelsValue {
        const option = this.getOption(showLabelsID);
        switch (option?.currentValue) {
            case "all":
                return showLabelsValue.ALL;
            case "losses":
                return showLabelsValue.LOSSES;
            case "hazards":
                return showLabelsValue.HAZARDS;
            case "systemConstraints":
                return showLabelsValue.SYSTEM_CONSTRAINTS;
            case "responsibilities":
                return showLabelsValue.RESPONSIBILITIES;
            case "ucas":
                return showLabelsValue.UCAS;
            case "controllerConstraints":
                return showLabelsValue.CONTROLLER_CONSTRAINTS;
            case "scenarios":
                return showLabelsValue.SCENARIOS;
            case "safetyConstraints":
                return showLabelsValue.SAFETY_CONSTRAINTS;
            case "automatic":
                return showLabelsValue.AUTOMATIC;
        }
        return option?.currentValue;
    }

    setShowRelationshipGraph(value: boolean): void {
        this.setOption(showRelationshipGraphID, value);
    }

    getShowRelationshipGraph(): boolean {
        return this.getOption(showRelationshipGraphID)?.currentValue;
    }

    setShowControlStructure(value: boolean): void {
        this.setOption(showControlStructureID, value);
    }

    getShowControlStructure(): boolean {
        return this.getOption(showControlStructureID)?.currentValue;
    }

    setShowProcessModels(value: boolean): void {
        this.setOption(showProcessModelsID, value);
    }

    getShowProcessModels(): boolean {
        return this.getOption(showProcessModelsID)?.currentValue;
    }

    setHierarchy(value: boolean): void {
        this.setOption(hierarchyID, value);
    }

    getHierarchy(): boolean {
        return this.getOption(hierarchyID)?.currentValue;
    }

    setGroupingUCAs(value: groupValue): void {
        const option = this.options.find(option => option.synthesisOption.id === groupingUCAsID);
        if (option) {
            switch (value) {
                case groupValue.NO_GROUPING:
                    option.currentValue = "No Grouping";
                    break;
                case groupValue.CONTROL_ACTION:
                    option.currentValue = "Group by Control Action";
                    break;
                case groupValue.SYSTEM_COMPONENT:
                    option.currentValue = "Group by System Component";
                    break;
            }
            option.synthesisOption.currentValue = option.currentValue;
        }
    }

    getGroupingUCAs(): groupValue {
        const option = this.getOption(groupingUCAsID);
        switch (option?.currentValue) {
            case "No Grouping":
                return groupValue.NO_GROUPING;
            case "Group by Control Action":
                return groupValue.CONTROL_ACTION;
            case "Group by System Component":
                return groupValue.SYSTEM_COMPONENT;
        }
        return option?.currentValue;
    }

    setFilteringUCAs(value: string): void {
        const option = this.options.find(option => option.synthesisOption.id === filteringUCAsID);
        if (option) {
            option.currentValue = value;
            option.synthesisOption.currentValue = value;
            (option.synthesisOption as DropDownOption).currentId = value;
        }
    }

    getFilteringUCAs(): string {
        return this.getOption(filteringUCAsID)?.currentValue;
    }

    setHideSysCons(value: boolean): void {
        this.setOption(hideSysConsID, value);
    }

    getHideSysCons(): boolean {
        return this.getOption(hideSysConsID)?.currentValue;
    }

    setHideResps(value: boolean): void {
        this.setOption(hideRespsID, value);
    }

    getHideRespsCons(): boolean {
        return this.getOption(hideRespsID)?.currentValue;
    }

    setHideUCAs(value: boolean): void {
        this.setOption(hideUCAsID, value);
    }

    getHideUCAs(): boolean {
        return this.getOption(hideUCAsID)?.currentValue;
    }

    setHideContCons(value: boolean): void {
        this.setOption(hideContConsID, value);
    }

    getHideContCons(): boolean {
        return this.getOption(hideContConsID)?.currentValue;
    }

    setHideScenarios(value: boolean): void {
        this.setOption(hideScenariosID, value);
    }

    getHideScenarios(): boolean {
        return this.getOption(hideScenariosID)?.currentValue;
    }

    setHideScenariosWithHazard(value: boolean): void {
        this.setOption(hideScenariosWithHazardID, value);
    }

    getHideScenariosWithHazard(): boolean {
        return this.getOption(hideScenariosWithHazardID)?.currentValue;
    }

    setHideSafetyConstraints(value: boolean): void {
        this.setOption(hideSafetyConstraintsID, value);
    }

    getHideSafetyConstraints(): boolean {
        return this.getOption(hideSafetyConstraintsID)?.currentValue;
    }

    /**
     * Updates the filterUCAs option with the availabe cotrol actions.
     * @param values The currently avaiable control actions.
     */
    updateFilterUCAsOption(values: { displayName: string; id: string }[]): void {
        const option = this.getOption(filteringUCAsID);
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

    protected setOption(id: string, value: any): void {
        const option = this.getOption(id);
        if (option) {
            option.currentValue = value;
            option.synthesisOption.currentValue = value;
        }
    }
}
