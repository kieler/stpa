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

import { AstNode, Reference } from "langium";
import { LangiumSprottySharedServices } from "langium-sprotty";
import { ActionUCAs, ContConstraint, Hazard, LossScenario, Responsibility, SafetyConstraint, SystemConstraint, UCA } from "../../generated/ast";
import { getModel } from "../../utils";
import { StpaResult, StpaComponent, UCA_TYPE } from "../utils";



export async function createResultData(uri: string, shared: LangiumSprottySharedServices): Promise<StpaResult> {
    const result: StpaResult = new StpaResult();
    // get the current model
    const model = await getModel(uri, shared);

    // losses
    const resultLosses: { id: string, description: string; }[] = [];
    model.losses.forEach(component => {
        resultLosses.push({ id: component.name, description: component.description });
    });
    result.losses = resultLosses;

    // TODO: consider subhazards (also their headers) and subconstraints
    result.hazards = createResultComponents(model.hazards);
    result.systemLevelConstraints = createResultComponents(model.systemLevelConstraints);
    result.controllerConstraints = createResultComponents(model.controllerConstraints);
    result.safetyCons = createResultComponents(model.safetyCons);

    model.responsibilities.forEach(component => {
        const responsibilities = createResultComponents(component.responsiblitiesForOneSystem);
        result.responsibilities[component.system.$refText] = responsibilities;
    });

    // loss scenarios
    model.scenarios.forEach(component => {
        createScenarioResult(component, result);
    });

    //UCAs
    model.allUCAs.forEach(component => {
        result.ucas.push(createUCAResult(component));
    });

    return result;
}

function createResultListComponents(components: LossScenario[] | UCA[]): StpaComponent[] {
    const resultList: StpaComponent[] = [];
    components.forEach(component => {
        resultList.push(createSingleListComponent(component));
    });
    return resultList;
}

function createSingleListComponent(component: LossScenario | UCA): StpaComponent {
    const id = component.name;
    const description = component.description;
    const references = component.list ? component.list.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", "): undefined;
    return { id, description, references };
}

function createResultComponents(components: Hazard[] | SystemConstraint[] | ContConstraint[] | SafetyConstraint[] | Responsibility[]): StpaComponent[] {
    const resultList: StpaComponent[] = [];
    components.forEach(component => {
        resultList.push(createSingleComponent(component));
    });
    return resultList;
}

function createSingleComponent(component: Hazard | SystemConstraint | ContConstraint | SafetyConstraint | Responsibility): StpaComponent {
    return { id: component.name, description: component.description, references: component.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", ") };
}

function createUCAResult(component: ActionUCAs): { controlAction: string, ucas: Record<string, StpaComponent[]>; } {
    const controlAction = component.system.$refText + "." + component.action.$refText;
    const ucas: Record<string, StpaComponent[]> = {};
    ucas[UCA_TYPE.NOT_PROVIDED] = createResultListComponents(component.notProvidingUcas);
    ucas[UCA_TYPE.PROVIDED] = createResultListComponents(component.providingUcas);
    ucas[UCA_TYPE.WRONG_TIME] = createResultListComponents(component.wrongTimingUcas);
    ucas[UCA_TYPE.CONTINUOUS] = createResultListComponents(component.continousUcas);
    return { controlAction, ucas };
}

function createScenarioResult(component: LossScenario, result: StpaResult): void {
    if (component.uca) {
        const scenario = createSingleListComponent(component);
        const scenarioList = result.ucaScenarios[component.uca.$refText];
        if (scenarioList !== undefined) {
            scenarioList.push(scenario);
        } else {
            result.ucaScenarios[component.uca.$refText] = [scenario];
        }
    } else {
        result.scenarios.push(createSingleListComponent(component));
    }
}