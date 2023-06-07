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
import { getModel } from "../utils";
import { ContConstraint, Hazard, SafetyConstraint, SystemConstraint } from "../generated/ast";

export async function createResultData(uri: string, shared: LangiumSprottySharedServices): Promise<{ id: string, description: string, references: string; }[][]> {
    const result: { id: string, description: string, references: string; }[][] = [];
    // get the current model
    const model = await getModel(uri, shared);

    // add losses
    const resultLosses: { id: string, description: string, references: string; }[] = [];
    model.losses.forEach(component => {
        resultLosses.push({ id: component.name, description: component.description, references: "" });
    });
    result.push(resultLosses);

    // TODO: consider subhazards (also their headers) and subconstraints
    createResultComponent(model.hazards, result);
    createResultComponent(model.systemLevelConstraints, result);
    // TODO: consider responsibilities

    createResultComponent(model.controllerConstraints, result);

    // TODO: add scenarios
    const resultScenarios: { id: string, description: string, references: string; }[] = [];
    // model.scenarios.forEach(component => {
    //     resultScenarios.push({ id: component.name, description: component.description, references: component.list.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", ") });
    // });
    result.push(resultScenarios);

    createResultComponent(model.safetyCons, result);
    //TODO: consider UCAs

    return result;
}

function createResultComponent(components: Hazard[] | SystemConstraint[] | ContConstraint[] | SafetyConstraint[], result: { id: string, description: string, references: string; }[][]): void {
    const resultList: { id: string, description: string, references: string; }[] = [];
    components.forEach(component => {
        resultList.push({ id: component.name, description: component.description, references: component.refs.map((ref: Reference<AstNode>) => ref.$refText).join(", ") });
    });
    result.push(resultList);
}