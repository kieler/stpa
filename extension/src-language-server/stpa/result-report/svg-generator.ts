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

import { SetSynthesisOptionsAction } from "../../options/actions";
import { StpaSynthesisOptions } from "../synthesis-options";

export const SVG_PATH = "/images";
export const CONTROL_STRUCTURE_PATH = "/control-structure.svg";
export const HAZARD_PATH = "/hazard.svg";
export const SYSTEM_CONSTRAINT_PATH = "/system-constraint.svg";
export const RESPONSIBILITY_PATH = "/responsibility.svg";
export const CONTROLLER_CONSTRAINT_PATH = "/controller-constraint.svg";
export const SCENARIO_PATH = "/scenario.svg";
export const SAFETY_REQUIREMENT_PATH = "/safety-requirement.svg";
export const COMPLETE_GRAPH_PATH = "/complete-graph.svg";

const savedOptions: Map<string, string> = new Map();

export function saveOptions(options: StpaSynthesisOptions): void {
    options.getSynthesisOptions().forEach(option => {
        savedOptions.set(option.synthesisOption.id, option.currentValue);
    });
}

export function resetOptions(options: StpaSynthesisOptions): SetSynthesisOptionsAction {
    options.getSynthesisOptions().forEach(option => {
        const savedValue = savedOptions.get(option.synthesisOption.id);
        if (savedValue) {
            option.currentValue = savedValue === "true" || savedValue === "false" ? savedValue === "true" : savedValue;
        }
        option.synthesisOption.currentValue = option.currentValue;
    });
    const setSynthesisOption = {
        kind: SetSynthesisOptionsAction.KIND,
        options: options.getSynthesisOptions().map(option => option.synthesisOption)
    } as SetSynthesisOptionsAction;
    return setSynthesisOption;
}

export function setControlStructureOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(false);
    options.setShowControlStructure(true);
}

export function setHazardGraphOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs("all UCAs");
    options.setHideSysCons(true);
    options.setHideResps(true);
    options.setHideUCAs(true);
    options.setHideContCons(true);
    options.setHideScenarios(true);
    options.setHideSafetyConstraints(true);
}

export function setSystemConstraintGraphOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs("all UCAs");
    options.setHideSysCons(false);
    options.setHideResps(true);
    options.setHideUCAs(true);
    options.setHideContCons(true);
    options.setHideScenarios(true);
    options.setHideSafetyConstraints(true);
}

export function setResponsibilityGraphOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs("all UCAs");
    options.setHideSysCons(false);
    options.setHideResps(false);
    options.setHideUCAs(true);
    options.setHideContCons(true);
    options.setHideScenarios(true);
    options.setHideSafetyConstraints(true);
}

export function setFilteredUcaGraphOptions(options: StpaSynthesisOptions, value: string): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs(value);
    options.setHideSysCons(true);
    options.setHideResps(false);
    options.setHideUCAs(false);
    options.setHideContCons(true);
    options.setHideScenarios(true);
    options.setHideSafetyConstraints(true);
}

export function setUcaGraphOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs("all UCAs");
    options.setHideSysCons(true);
    options.setHideResps(false);
    options.setHideUCAs(false);
    options.setHideContCons(true);
    options.setHideScenarios(true);
    options.setHideSafetyConstraints(true);
}

export function setControllerConstraintGraphOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs("all UCAs");
    options.setHideSysCons(true);
    options.setHideResps(false);
    options.setHideUCAs(false);
    options.setHideContCons(false);
    options.setHideScenarios(true);
    options.setHideSafetyConstraints(true);
}

export function setScenarioGraphOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs("all UCAs");
    options.setHideSysCons(true);
    options.setHideResps(false);
    options.setHideUCAs(false);
    options.setHideContCons(false);
    options.setHideScenarios(false);
    options.setHideSafetyConstraints(true);
}

export function setSafetyRequirementGraphOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs("all UCAs");
    options.setHideSysCons(true);
    options.setHideResps(false);
    options.setHideUCAs(false);
    options.setHideContCons(false);
    options.setHideScenarios(false);
    options.setHideSafetyConstraints(false);
}

export function setRelationshipGraphOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(true);
    options.setShowControlStructure(false);
    options.setFilteringUCAs("all UCAs");
    options.setHideSysCons(false);
    options.setHideResps(false);
    options.setHideUCAs(false);
    options.setHideContCons(false);
    options.setHideScenarios(false);
    options.setHideSafetyConstraints(false);
}