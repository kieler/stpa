import { LangiumDocument } from "langium";
import { StpaServices } from "../stpa-module";
import { Model } from "../generated/ast";
import { URI } from "vscode-languageserver";
import { ControlAction, Rule, SystemVariables, Variable, VariableValues } from "../../src-context-table/utils";

export class ContextTableProvider {
    protected services: StpaServices;

    constructor(services: StpaServices) {
        this.services = services;
    }

    /**
     * Collects all the data needed for constructing the context table.
     * @returns The data in a set of arrays.
     */
    getData(uri: URI) {
        // get the current model
        const textDocuments = this.services.shared.workspace.LangiumDocuments;
        const currentDoc = textDocuments.getOrCreateDocument(uri as any) as LangiumDocument<Model>;
        const model: Model = currentDoc.parseResult.value;
        
        let actions: ControlAction[] = [];
        let variables : SystemVariables[] = [];
        let rules: Rule[] = [];
        model.controlStructure.nodes.forEach(node => {
            node.actions.forEach(action => {
                action.comms.forEach(command => {
                    actions.push({controller: node.name, action: command.name});
                })
            })
            let variableValues : VariableValues[] = [];
            node.variables.forEach(variable => {
                variableValues.push({name: variable.name, values: variable.values});
            })
            variables.push({system: node.name, variables: variableValues});
        });
        model.rules.forEach(rule => {
            let ruleVariables: Variable[] = [];
            for (let i = 0; i < rule.values.length; i++) {
                if (rule.vars[i].ref?.name) {
                    ruleVariables.push({name:rule.vars[i].ref!.name, value: rule.values[i]});
                }
            }
            const hazardList = rule.list.refs;
            let hazards : string[] = [];
            hazardList.forEach(hazard => {
                if(hazard.ref?.name) {
                    hazards.push(hazard.ref!.name);
                }
            });
            if (rule.action.ref?.name && rule.system.ref?.name) {
                rules.push({id:rule.name, controlAction: {controller: rule.system.ref!.name,action: rule.action.ref!.name}, type: rule.type.value, 
                    variables: ruleVariables, hazards: hazards});
            }
        })
        return [rules, actions, variables] as const;
    }
}