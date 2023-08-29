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
import { StpaSynthesisOptions } from "../diagram/synthesis-options";

/* the paths for the several diagrams of the STPA aspects */
export const SVG_PATH = "/images";
export const CONTROL_STRUCTURE_PATH = "/control-structure.svg";
export const HAZARD_PATH = "/hazard.svg";
export const SYSTEM_CONSTRAINT_PATH = "/system-constraint.svg";
export const RESPONSIBILITY_PATH = "/responsibility.svg";
export const CONTROLLER_CONSTRAINT_PATH = "/controller-constraint.svg";
export const SCENARIO_PATH = "/scenario.svg";
export const SAFETY_REQUIREMENT_PATH = "/safety-requirement.svg";
export const COMPLETE_GRAPH_PATH = "/complete-graph.svg";

/* used to reset the options after diagrams were created */
const savedOptions: Map<string, string> = new Map();

/**
 * Saves the current values of the {@code options}.
 * @param options The synthesis options.
 */
export function saveOptions(options: StpaSynthesisOptions): void {
    options.getSynthesisOptions().forEach((option) => {
        savedOptions.set(option.synthesisOption.id, option.currentValue);
    });
}

/**
 * Sates the values of {@code options} to the ones saved in savedOptions.
 * @param options The synthesis options.
 * @returns an action to send the new values to the client.
 */
export function resetOptions(options: StpaSynthesisOptions): SetSynthesisOptionsAction {
    // set the values to the saved ones
    options.getSynthesisOptions().forEach((option) => {
        const savedValue = savedOptions.get(option.synthesisOption.id);
        if (savedValue) {
            option.currentValue = savedValue === "true" || savedValue === "false" ? savedValue === "true" : savedValue;
        }
        option.synthesisOption.currentValue = option.currentValue;
    });
    // create an action to set the options on the client
    const setSynthesisOption = {
        kind: SetSynthesisOptionsAction.KIND,
        options: options.getSynthesisOptions().map((option) => option.synthesisOption),
    } as SetSynthesisOptionsAction;
    return setSynthesisOption;
}

/**
 * Sets the values of {@code options} such that only the control structure is shown.
 * @param options The synthesis options.
 */
export function setControlStructureOptions(options: StpaSynthesisOptions): void {
    options.setShowRelationshipGraph(false);
    options.setShowControlStructure(true);
}

/**
 * Sets the values of {@code options} such that the relationship graph is reduced to the hazards.
 * @param options The synthesis options.
 */
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

/**
 * Sets the values of {@code options} such that the relationship graph is reduced to the system-level constraints.
 * @param options The synthesis options.
 */
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

/**
 * Sets the values of {@code options} such that the relationship graph is reduced to the responsibilities.
 * @param options The synthesis options.
 */
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

/**
 * Sets the values of {@code options} such that the relationship graph is filtered based on {@code value}.
 * @param options The synthesis options.
 * @param value The value the "filter UCA" option should be set to.
 */
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

/**
 * Sets the values of {@code options} such that the relationship graph is reduced to the controller constraints without system-level constraints.
 * @param options The synthesis options.
 */
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

/**
 * Sets the values of {@code options} such that the relationship graph is reduced to the loss scenarios without system-level constraints.
 * @param options The synthesis options.
 */
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

/**
 * Sets the values of {@code options} such that the relationship graph is reduced to the safety constraints without system-level constraints.
 * @param options The synthesis options.
 */
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

/**
 * Sets the values of {@code options} such that the whole relationship graph is shown and the control structure is hidden.
 * @param options The synthesis options.
 */
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
