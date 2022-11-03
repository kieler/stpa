import { LangiumDocument } from "langium";
import { StpaServices } from "../stpa-module";
import { Model } from "../generated/ast";
import { URI } from "vscode-languageserver";

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
        
        let actions: [string, string][] = [];
        let variables : [string, [string, string[]][]][] = [];
        let rules: [string, [string, string], string, [string, string][], string[]][] = [];
        model.controlStructure.nodes.forEach(node => {
            node.actions.forEach(action => {
                action.comms.forEach(command => {
                    actions.push([node.name, command.name]);
                })
            })
            let variableValues : [string, string[]][] = [];
            node.variables.forEach(variable => {
                variableValues.push([variable.name, variable.values]);
            })
            variables.push([node.name, variableValues]);
        });
        model.rules.forEach(rule => {
            let varVals: [string, string][] = [];
            for (let i = 0; i < rule.values.length; i++) {
                if (rule.vars[i].ref?.name) {
                    varVals.push([rule.vars[i].ref!.name, rule.values[i]]);
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
                rules.push([rule.name, [rule.system.ref!.name, rule.action.ref!.name], rule.type.value, varVals, hazards]);
            }
        })
        return [rules, actions, variables] as const;
    }
}