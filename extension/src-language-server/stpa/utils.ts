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

import { LangiumSharedServices } from "langium";
import { LangiumSprottySharedServices } from "langium-sprotty";
import {
    Command,
    ContConstraint,
    Context,
    Graph,
    Hazard,
    HazardList,
    Loss,
    LossScenario,
    Node,
    Responsibility,
    Rule,
    SafetyConstraint,
    SystemConstraint,
    UCA,
    Variable
} from "../generated/ast";
import { getModel } from "../utils";

export type leafElement =
    | Loss
    | Hazard
    | SystemConstraint
    | Responsibility
    | UCA
    | ContConstraint
    | LossScenario
    | SafetyConstraint
    | Context;
export type elementWithName =
    | Loss
    | Hazard
    | SystemConstraint
    | Responsibility
    | UCA
    | ContConstraint
    | LossScenario
    | SafetyConstraint
    | Node
    | Variable
    | Graph
    | Command
    | Context
    | Rule;
export type elementWithRefs =
    | Hazard
    | SystemConstraint
    | Responsibility
    | HazardList
    | ContConstraint
    | SafetyConstraint;

/**
 * Returns the control actions defined in the file given by the {@code uri}.
 * @param uri Uri of the file which control actions should be returned.
 * @param shared The shared services of Langium.
 * @returns the control actions that are defined in the file determined by the {@code uri}.
 */
export async function getControlActions(
    uri: string,
    shared: LangiumSprottySharedServices | LangiumSharedServices
): Promise<Record<string, string[]>> {
    const controlActionsMap: Record<string, string[]> = {};
    // get the model from the file determined by the uri
    const model = await getModel(uri, shared);
    // collect control actions grouped by their controller
    model.controlStructure?.nodes.forEach((systemComponent) => {
        systemComponent.actions.forEach((action) => {
            action.comms.forEach((command) => {
                const actionList = controlActionsMap[systemComponent.name];
                if (actionList !== undefined) {
                    actionList.push(command.name);
                } else {
                    controlActionsMap[systemComponent.name] = [command.name];
                }
            });
        });
    });
    return controlActionsMap;
}

/**
 * Collects the {@code topElements}, their children, their children's children and so on.
 * @param topElements The top elements that possbible have children.
 * @returns A list with the given {@code topElements} and their descendants.
 */
export function collectElementsWithSubComps(topElements: (Hazard | SystemConstraint)[]): (Hazard | SystemConstraint)[] {
    let result = topElements;
    let todo = topElements;
    for (let i = 0; i < todo.length; i++) {
        const current = todo[i];
        if (current.subComps) {
            result = result.concat(current.subComps);
            todo = todo.concat(current.subComps);
        }
    }
    return result;
}

export class StpaResult {
    title: string;
    losses: StpaComponent[] = [];
    hazards: StpaComponent[] = [];
    systemLevelConstraints: StpaComponent[] = [];
    // sorted by system components
    responsibilities: Record<string, StpaComponent[]> = {};
    // sorted first by control action, then by uca type
    ucas: { controlAction: string, ucas: Record<string, StpaComponent[]>; }[] = [];
    controllerConstraints: StpaComponent[] = [];
    // sorted by ucas
    ucaScenarios: Record<string, StpaComponent[]> = {};
    scenarios: StpaComponent[] = [];
    safetyCons: StpaComponent[] = [];
}

export class StpaComponent {
    id: string;
    description: string;
    references?: string;
    subComponents?: StpaComponent[];
}

/**
 * Provides the different UCA types.
 */
export class UCA_TYPE {
    static NOT_PROVIDED = "not-provided";
    static PROVIDED = "provided";
    static TOO_EARLY = "too-early";
    static TOO_LATE = "too-late";
    static APPLIED_TOO_LONG = "applied-too-long";
    static STOPPED_TOO_SOON = "stopped-too-soon";
    static WRONG_TIME = "wrong-time";
    static CONTINUOUS = "continuous-problem";
    static UNDEFINED = "undefined";
}