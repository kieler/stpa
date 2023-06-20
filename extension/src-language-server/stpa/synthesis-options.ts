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

import { DropDownOption, TransformationOptionType, ValuedSynthesisOption } from "../options/option-models";

const hierarchyID = "hierarchy";
const groupingUCAsID = "groupingUCAs";
export const filteringUCAsID = "filteringUCAs";
const hideSysConsID = "hideSysCons";
const hideRespsID = "hideResps";
const hideUCAsID = "hideUCAs";
const hideContConsID = "hideContCons";
const hideScenariosID = "hideScenarios";
const hideSafetyConstraintsID = "hideSafetyConstraints";
const showControlStructureID = "showControlStructure";
const showRelationshipGraphID = "showRelationshipGraph";

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
        values: [true, false]
    },
    currentValue: true
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
        values: [true, false]
    },
    currentValue: true
};

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
 * Boolean option to toggle the visualization of UCAs.
 */
const hideUCAsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideUCAsID,
        name: "Hide UCAs",
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

/**
 * Boolean option to toggle the visualization of safety constraints.
 */
const hideSafetyConstraintsOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hideSafetyConstraintsID,
        name: "Hide safety constraints",
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
            hideSysConsOption, hideRespsOption, hideUCAsOption, hideContConsOption, 
            hideScenariosOption, hideSafetyConstraintsOption, showControlStructureOption, showRelationshipGraphOption
        ];
    }

    getSynthesisOptions(): ValuedSynthesisOption[] {
        return this.options;
    }

    setShowRelationshipGraph(value: boolean): void {
        this.setOption(showRelationshipGraphID, value);
    }

    getShowRelationshipGraph(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === showRelationshipGraphID);
        return option?.currentValue;
    }

    setShowControlStructure(value: boolean): void {
        this.setOption(showControlStructureID, value);
    }

    getShowControlStructure(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === showControlStructureID);
        return option?.currentValue;
    }

    setHierarchy(value: boolean): void {
        this.setOption(hierarchyID, value);
    }

    getHierarchy(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hierarchyID);
        return option?.currentValue;
    }

    setGroupingUCAs(value: groupValue): void {
        const option = this.options.find(option => option.synthesisOption.id === groupingUCAsID);
        if (option) {
            switch (value) {
                case groupValue.NO_GROUPING: option.currentValue = "no grouping"; break;
                case groupValue.CONTROL_ACTION: option.currentValue = "Group by Control Action"; break;
                case groupValue.SYSTEM_COMPONENT: option.currentValue = "Group by System Component"; break;
            }
            option.synthesisOption.currentValue = option.currentValue;
        }
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

    setFilteringUCAs(value: string): void {
        const option = this.options.find(option => option.synthesisOption.id === filteringUCAsID);
        if (option) {
            option.currentValue = value;
            option.synthesisOption.currentValue = value;
            (option.synthesisOption as DropDownOption).currentId = value;
        }
    }

    getFilteringUCAs(): string {
        const option = this.options.find(option => option.synthesisOption.id === filteringUCAsID);
        return option?.currentValue;
    }

    setHideSysCons(value: boolean): void {
        this.setOption(hideSysConsID, value);
    }

    getHideSysCons(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideSysConsID);
        return option?.currentValue;
    }

    setHideResps(value: boolean): void {
        this.setOption(hideRespsID, value);
    }

    getHideRespsCons(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideRespsID);
        return option?.currentValue;
    }

    setHideUCAs(value: boolean): void {
        this.setOption(hideUCAsID, value);
    }

    getHideUCAs(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideUCAsID);
        return option?.currentValue;
    }

    setHideContCons(value: boolean): void {
        this.setOption(hideContConsID, value);
    }

    getHideContCons(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideContConsID);
        return option?.currentValue;
    }

    setHideScenarios(value: boolean): void {
        this.setOption(hideScenariosID, value);
    }

    getHideScenarios(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideScenariosID);
        return option?.currentValue;
    }

    setHideSafetyConstraints(value: boolean): void {
        this.setOption(hideSafetyConstraintsID, value);
    }

    getHideSafetyConstraints(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hideSafetyConstraintsID);
        return option?.currentValue;
    }

    protected setOption(id: string, value: any): void {
        const option = this.options.find(option => option.synthesisOption.id === id);
        if (option) {
            option.currentValue = value;
            option.synthesisOption.currentValue = value;
        }
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
