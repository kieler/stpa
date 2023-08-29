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
import {
    ActionUCAs,
    ContConstraint,
    Hazard,
    LossScenario,
    Responsibility,
    SafetyConstraint,
    SystemConstraint,
    UCA,
} from "../../generated/ast";
import { getModel } from "../../utils";
import { StpaComponent, StpaResult, UCA_TYPE } from "../utils";

/**
 * Creates the STPA result data.
 * @param uri The uri of the model for which the result data should be created.
 * @param shared The shared services of sprotty and langium.
 * @returns the STPA result data for the model with the given {@code uri}.
 */
export async function createResultData(uri: string, shared: LangiumSprottySharedServices): Promise<StpaResult> {
    const result: StpaResult = new StpaResult();
    // get the current model
    const model = await getModel(uri, shared);

    // losses
    const resultLosses: { id: string; description: string }[] = [];
    model.losses.forEach((component) => {
        resultLosses.push({ id: component.name, description: component.description });
    });
    result.losses = resultLosses;

    // TODO: consider subhazard headers
    result.hazards = createHazardOrSystemConstraintComponents(model.hazards);
    result.systemLevelConstraints = createHazardOrSystemConstraintComponents(model.systemLevelConstraints);
    result.controllerConstraints = createResultComponents(model.controllerConstraints);
    result.safetyCons = createResultComponents(model.safetyCons);

    // responsibilities
    model.responsibilities.forEach((component) => {
        const responsibilities = createResultComponents(component.responsiblitiesForOneSystem);
        // responsibilities are grouped by their system component
        result.responsibilities[component.system.$refText] = responsibilities;
    });

    // loss scenarios
    model.scenarios.forEach((component) => {
        createScenarioResult(component, result);
    });

    //UCAs
    model.allUCAs.forEach((component) => {
        result.ucas.push(createUCAResult(component));
    });

    // title for the result report
    result.title = model.controlStructure?.name ?? "...";

    return result;
}

/**
 * Creates the result components list for loss scenarios and UCAs.
 * @param components The scenarios/UCAs for which the result components should be created.
 * @returns the result components list for loss scenarios/UCAs.
 */
function createResultListComponents(components: LossScenario[] | UCA[]): StpaComponent[] {
    const resultList: StpaComponent[] = [];
    components.forEach((component) => {
        resultList.push(createSingleListComponent(component));
    });
    return resultList;
}

/**
 * Translates a scenarios/UCA to a result component.
 * @param component The component to translate.
 * @returns a scenarios/UCA result component.
 */
function createSingleListComponent(component: LossScenario | UCA): StpaComponent {
    const id = component.name;
    const description = component.description;
    const references = component.list
        ? component.list.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", ")
        : undefined;
    return { id, description, references };
}

/**
 * Creates the result components for the given {@code components}.
 * @param components The STPA components to translate.
 * @returns the result components for the given {@code components}.
 */
function createResultComponents(
    components: Hazard[] | SystemConstraint[] | ContConstraint[] | SafetyConstraint[] | Responsibility[]
): StpaComponent[] {
    const resultList: StpaComponent[] = [];
    components.forEach((component) => {
        resultList.push(createSingleComponent(component));
    });
    return resultList;
}

/**
 * Creates the result components for the given {@code components} including their subcomponents.
 * @param components The Hazards/System-level constraints to translate.
 * @returns the result components for the given {@code components} including their subcomponents.
 */
function createHazardOrSystemConstraintComponents(components: Hazard[] | SystemConstraint[]): StpaComponent[] {
    const resultList: StpaComponent[] = [];
    components.forEach((component) => {
        const resultComponent = createSingleComponent(component);
        resultComponent.subComponents = createHazardOrSystemConstraintComponents(component.subComps);
        resultList.push(resultComponent);
    });
    return resultList;
}

/**
 * Translates the given {@code component} to a result component.
 * @param component the component to translate.
 * @returns the result component for the given {@code component}.
 */
function createSingleComponent(
    component: Hazard | SystemConstraint | ContConstraint | SafetyConstraint | Responsibility
): StpaComponent {
    return {
        id: component.name,
        description: component.description,
        references: component.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", "),
    };
}

/**
 * Creates the result for UCAs grouped by the UCA types.
 * @param component The UCAs for which the result should be created.
 * @returns the result for UCAs grouped by the UCA types.
 */
function createUCAResult(component: ActionUCAs): { controlAction: string; ucas: Record<string, StpaComponent[]> } {
    const controlAction = component.system.$refText + "." + component.action.$refText;
    const ucas: Record<string, StpaComponent[]> = {};
    ucas[UCA_TYPE.NOT_PROVIDED] = createResultListComponents(component.notProvidingUcas);
    ucas[UCA_TYPE.PROVIDED] = createResultListComponents(component.providingUcas);
    ucas[UCA_TYPE.WRONG_TIME] = createResultListComponents(component.wrongTimingUcas);
    ucas[UCA_TYPE.CONTINUOUS] = createResultListComponents(component.continousUcas);
    return { controlAction, ucas };
}

/**
 * Creates ands adds the scenario results.
 * @param component The scenarios for which the result should be created and added.
 * @param result The STPA result to which the created results should be added.
 */
function createScenarioResult(component: LossScenario, result: StpaResult): void {
    if (component.uca) {
        // translates scenario with a reference to an UCA
        const scenario = createSingleListComponent(component);
        const scenarioList = result.ucaScenarios[component.uca.$refText];
        if (scenarioList !== undefined) {
            scenarioList.push(scenario);
        } else {
            result.ucaScenarios[component.uca.$refText] = [scenario];
        }
    } else {
        // translates scenario without a reference to an UCA
        result.scenarios.push(createSingleListComponent(component));
    }
}
