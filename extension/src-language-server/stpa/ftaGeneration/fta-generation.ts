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

import { LangiumSprottySharedServices } from "langium-sprotty";
import { Component, Hazard, Model, ModelFTA } from "../../generated/ast";
import { getModel } from "../../utils";

/**
 * Create the fault trees for an stpa model as ASTs
 * @param uri The uri of the stpa file for which the fault trees should be created.
 * @param shared The shared services of Langium and Sprotty.
 * @returns the ASTs of the created fault trees.
 */
export async function createFaultTrees(uri: string, shared: LangiumSprottySharedServices): Promise<ModelFTA[]> {
    // get the current model
    const model = (await getModel(uri, shared)) as Model;
    const faultTrees: ModelFTA[] = [];
    for (const hazard of model.hazards) {
        faultTrees.push(createFaulTreeForHazard(model, hazard));
    }
    return faultTrees;
}

/**
 * Creates a fault tree with {@code hazard} as top event.
 * @param stpaModel The stpa model that contains the {@code hazard}.
 * @param hazard The hazard for which the fault tree should be created.
 * @returns the AST of the created fault tree with {@code hazard} as top event.
 */
function createFaulTreeForHazard(stpaModel: Model, hazard: Hazard): ModelFTA {
    const ftaModel = {} as ModelFTA;
    ftaModel.components = [];
    ftaModel.gates = [];

    const component = { name: hazard.name, description: hazard.description } as Component;
    ftaModel.components.push(component);

    const scenarios = stpaModel.scenarios.filter((scenario) => {
        if (scenario.list?.refs?.find((ref) => ref.$refText === hazard.name) !== undefined) {
            return true;
        } else {
            return false;
        }
    });
    for (const scenario of scenarios) {
        const component = { name: scenario.name, description: scenario.description } as Component;
        ftaModel.components.push(component);
    }
    //TODO: implement

    return ftaModel;
}
