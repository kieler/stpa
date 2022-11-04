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

import { LangiumDocument } from "langium";
import { StpaServices } from "../stpa-module";
import { Model } from "../generated/ast";
import { URI } from "vscode-languageserver";
import { ContextTableData, ControlAction, Rule, SystemVariables, Variable, VariableValues } from "../../src-context-table/utils";

export class ContextTableProvider {
    protected services: StpaServices;

    constructor(services: StpaServices) {
        this.services = services;
    }

    /**
     * Collects all the data needed for constructing the context table.
     * @returns The data in a set of arrays.
     */
    getData(uri: URI): ContextTableData {
        // get the current model
        const textDocuments = this.services.shared.workspace.LangiumDocuments;
        const currentDoc = textDocuments.getOrCreateDocument(uri as any) as LangiumDocument<Model>;
        const model: Model = currentDoc.parseResult.value;

        let actions: ControlAction[] = [];
        let variables: SystemVariables[] = [];
        let rules: Rule[] = [];

        // collect control actions and variables
        model.controlStructure.nodes.forEach(systemComponent => {
            // control actions of the current system component
            systemComponent.actions.forEach(action => {
                action.comms.forEach(command => {
                    actions.push({ controller: systemComponent.name, action: command.name });
                });
            });
            // variables of the current system component
            const variableValues: VariableValues[] = [];
            systemComponent.variables.forEach(variable => {
                variableValues.push({ name: variable.name, values: variable.values });
            });
            variables.push({ system: systemComponent.name, variables: variableValues });
        });
        // collect rules
        model.rules.forEach(rule => {
            // determine context variables
            const contextVariables: Variable[] = [];
            for (let i = 0; i < rule.values.length; i++) {
                if (rule.vars[i].ref?.name) {
                    contextVariables.push({ name: rule.vars[i].ref!.name, value: rule.values[i] });
                }
            }
            //determine hazards
            const hazards: string[] = [];
            const hazardList = rule.list.refs;
            hazardList.forEach(hazard => {
                if (hazard.ref?.name) {
                    hazards.push(hazard.ref.name);
                }
            });
            // create rule
            if (rule.action.ref?.name && rule.system.ref?.name) {
                rules.push({
                    id: rule.name, controlAction: { controller: rule.system.ref!.name, action: rule.action.ref!.name }, type: rule.type.value,
                    variables: contextVariables, hazards: hazards
                });
            }
        });
        return { rules: rules, actions: actions, systemVariables: variables };
    }
}