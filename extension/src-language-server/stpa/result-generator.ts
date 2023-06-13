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
import { ContConstraint, Hazard, Responsibility, SafetyConstraint, SystemConstraint } from "../generated/ast";
import { getModel } from "../utils";
import { StpaResult, StpaComponent, UCA_TYPE } from "./utils";



export async function createResultData(uri: string, shared: LangiumSprottySharedServices): Promise<StpaResult> {
    const result: StpaResult = new StpaResult();
    // get the current model
    const model = await getModel(uri, shared);

    // add losses
    const resultLosses: { id: string, description: string; }[] = [];
    model.losses.forEach(component => {
        resultLosses.push({ id: component.name, description: component.description });
    });
    result.losses = resultLosses;

    // TODO: consider subhazards (also their headers) and subconstraints
    result.hazards = createResultComponent(model.hazards);
    result.systemLevelConstraints = createResultComponent(model.systemLevelConstraints);
    result.controllerConstraints = createResultComponent(model.controllerConstraints);
    result.safetyCons = createResultComponent(model.safetyCons);

    model.responsibilities.forEach(component => {
        const responsibilities = createResultComponent(component.responsiblitiesForOneSystem);
        result.responsibilities[component.system.$refText] = responsibilities;
    });

    model.scenarios.forEach(component => {
        if (component.uca) {
            const scenario = { id: component.name, description: component.description, references: component.list?.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", ") };

            const scenarioList = result.ucaScenarios[component.uca.$refText];
            if (scenarioList !== undefined) {
                scenarioList.push(scenario);
            } else {
                result.ucaScenarios[component.uca.$refText] = [scenario];
            }
        } else {
            const resultComp = { id: component.name, description: component.description, references: component.list.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", ") };
            result.scenarios.push(resultComp);
        }
    });

    //TODO: consider UCAs
    /* model.allUCAs.forEach(component => {
        const controlAction = component.system.$refText + "." + component.action.$refText;
        let ucas: Record<string, StpaComponent[]> = {};
        //uca[UCA_TYPE.PROVIDED] = createResultComponent(component.ucas);
    }); */

    return result;
}

function createResultComponent(components: Hazard[] | SystemConstraint[] | ContConstraint[] | SafetyConstraint[] | Responsibility[]): StpaComponent[] {
    const resultList: StpaComponent[] = [];
    components.forEach(component => {
        resultList.push({ id: component.name, description: component.description, references: component.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", ") });
    });
    return resultList;
}