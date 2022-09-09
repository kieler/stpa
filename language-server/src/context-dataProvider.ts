import { LangiumDocuments, LangiumDocument } from "langium";
import { StpaServices } from "./stpa-module";
import { Model } from "./generated/ast";
import { URI } from "vscode-languageserver";

export class ContextTableProvider {
    protected textDocuments: LangiumDocuments;
    protected services: StpaServices;
    private uri: URI;

    constructor(services: StpaServices) {
        this.textDocuments = services.shared.workspace.LangiumDocuments;
        this.services = services;
    }

    /**
     * Gets a sent URI and saves it into a class variable.
     * @param sentUri The received URI (from the language extension).
     */
    getUri(sentUri: URI) {
        this.uri = sentUri;
    }

    /**
     * Collects all the data needed for constructing the context table.
     * @returns The data in a set of arrays.
     */
    getContext() {
        this.textDocuments = this.services.shared.workspace.LangiumDocuments;
        const currentDoc = this.textDocuments.getOrCreateDocument(this.uri as any) as LangiumDocument<Model>;
        const model: Model = currentDoc.parseResult.value;
        
        let actions: [string, string][] = [];
        let variables : [string, [string, string[]][]][] = [];
        let rules: [string, [string, string], string, [string, string][], string[]][] = [];
        model.controlStructure.nodes.forEach(element => {
            element.actions.forEach(action => {
                action.comms.forEach(command => {
                    actions.push([element.name, command.name]);
                })
            })
            let var2 : [string, string[]][] = [];
            element.variables.forEach(variable => {
                var2.push([variable.name, variable.values]);
            })
            variables.push([element.name, var2]);
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