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

import { ActionUCAs, ContConstraint, Graph, Hazard, Loss, LossScenario, Model, Resps, Rule, SafetyConstraint, SystemConstraint } from "./generated/ast";
import { StpaSynthesisOptions } from "./options/synthesis-options";

/**
 * Needed to work on a filtered model without changing the original model.
 */
export class CustomModel {
    losses: Loss[];
    hazards: Hazard[];
    systemLevelConstraints: SystemConstraint[];
    responsibilities: Resps[];
    allUCAs: ActionUCAs[];
    controllerConstraints: ContConstraint[];
    scenarios: LossScenario[];
    safetyCons: SafetyConstraint[];
    controlStructure: Graph;
    rules: Rule[];
}

/**
 * Creates a new model based on the original {@code model} and the {@code options}.
 * @param model The original model that should be filtered.
 * @param options The synthesis options determining what should be filtered.
 * @returns A new model which only contains the filtered components.
 */
export function filterModel(model: Model, options: StpaSynthesisOptions): CustomModel {
    // updates the control actions that can be used to filter the UCAs
    setFilterUCAOption(model.allUCAs, model.rules, options);
    let newModel = new CustomModel();
    // aspects for which no filter exists are just copied
    newModel.losses = model.losses;
    newModel.hazards = model.hazards;

    newModel.systemLevelConstraints = options.getHideSysCons() ? [] : model.systemLevelConstraints;
    newModel.responsibilities = options.getHideSysCons() || options.getHideRespsCons() ? [] : model.responsibilities;

    // filter UCAs by the filteringUCA option
    newModel.allUCAs = model.allUCAs?.filter(allUCA =>
        (allUCA.system.ref?.name + "." + allUCA.action.ref?.name) == options.getFilteringUCAs()
        || options.getFilteringUCAs() == "all UCAs");
    newModel.rules = model.rules?.filter(rule =>
        (rule.system.ref?.name + "." + rule.action.ref?.name) == options.getFilteringUCAs()
        || options.getFilteringUCAs() == "all UCAs");
    newModel.controllerConstraints = options.getHideContCons() ? [] :
        model.controllerConstraints?.filter(cons =>
            (cons.refs[0].ref?.$container.system.ref?.name + "."
                + cons.refs[0].ref?.$container.action.ref?.name) == options.getFilteringUCAs()
            || options.getFilteringUCAs() == "all UCAs");
    newModel.scenarios = options.getHideScenarios() ? [] :
        model.scenarios?.filter(scenario =>
            (!scenario.uca || scenario.uca?.ref?.$container.system.ref?.name + "."
                + scenario.uca?.ref?.$container.action.ref?.name) == options.getFilteringUCAs()
            || options.getFilteringUCAs() == "all UCAs");

    newModel.safetyCons = options.getHideScenarios() ? [] : model.safetyCons;
    newModel.controlStructure = model.controlStructure;
    return newModel;
}

/**
 * Updates the filterUCA option with the current available control actions.
 * @param allUCAs All common UCAs.
 * @param rules All rules for context UCAs.
 * @param options The synthesis options for the model.
 */
function setFilterUCAOption(allUCAs: ActionUCAs[], rules: Rule[], options: StpaSynthesisOptions): void {
    const set = new Set<string>();
    set.add("all UCAs");
    // collect all available control actions
    allUCAs.forEach(uca => {
        if (!set.has(uca.system.ref?.name + "." + uca.action.ref?.name)) {
            set.add(uca.system.ref?.name + "." + uca.action.ref?.name);
        }
    });
    rules.forEach(rule => {
        if (!set.has(rule.system.ref?.name + "." + rule.action.ref?.name)) {
            set.add(rule.system.ref?.name + "." + rule.action.ref?.name);
        }
    })
    // generate the options for the UCAs
    const list: { displayName: string; id: string; }[] = [];
    set.forEach(entry => list.push({ displayName: entry, id: entry }));
    // update the option
    options.updateFilterUCAsOption(list);
}
