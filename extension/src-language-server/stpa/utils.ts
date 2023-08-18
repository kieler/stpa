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

import { AstNode, LangiumSharedServices } from "langium";
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
    Variable,
    isContConstraint,
    isContext,
    isHazard,
    isLoss,
    isLossScenario,
    isResponsibility,
    isSafetyConstraint,
    isSystemConstraint,
    isUCA
} from "../generated/ast";
import { getModel } from "../utils";
import { STPANode } from "./diagram/stpa-interfaces";
import { STPAAspect } from "./diagram/stpa-model";
import { groupValue } from "./diagram/synthesis-options";


export type leafElement = Loss | Hazard | SystemConstraint | Responsibility | UCA | ContConstraint | LossScenario | SafetyConstraint | Context;
export type elementWithName = Loss | Hazard | SystemConstraint | Responsibility | UCA | ContConstraint | LossScenario | SafetyConstraint | Node | Variable | Graph | Command | Context | Rule;
export type elementWithRefs = Hazard | SystemConstraint | Responsibility | HazardList | ContConstraint | SafetyConstraint;

/**
 * Returns the control actions defined in the file given by the {@code uri}.
 * @param uri Uri of the file which control actions should be returned.
 * @param shared The shared services of Langium.
 * @returns the control actions that are defined in the file determined by the {@code uri}.
 */
export function getControlActions(uri: string, shared: LangiumSprottySharedServices | LangiumSharedServices): Record<string, string[]> {
    const controlActionsMap: Record<string, string[]> = {};
    // get the model from the file determined by the uri
    const model = getModel(uri, shared);
    // collect control actions grouped by their controller
    model.controlStructure?.nodes.forEach(systemComponent => {
        systemComponent.actions.forEach(action => {
            action.comms.forEach(command => {
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
 * Getter for the aspect of a STPA component.
 * @param node AstNode which aspect should determined.
 * @returns the aspect of {@code node}.
 */
export function getAspect(node: AstNode): STPAAspect {
    if (isLoss(node)) {
        return STPAAspect.LOSS;
    } else if (isHazard(node)) {
        return STPAAspect.HAZARD;
    } else if (isSystemConstraint(node)) {
        return STPAAspect.SYSTEMCONSTRAINT;
    } else if (isUCA(node) || isContext(node)) {
        return STPAAspect.UCA;
    } else if (isResponsibility(node)) {
        return STPAAspect.RESPONSIBILITY;
    } else if (isContConstraint(node)) {
        return STPAAspect.CONTROLLERCONSTRAINT;
    } else if (isLossScenario(node)) {
        return STPAAspect.SCENARIO;
    } else if (isSafetyConstraint(node)) {
        return STPAAspect.SAFETYREQUIREMENT;
    }
    return STPAAspect.UNDEFINED;
}
