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
        
        let hazards : string[] = [];
        let actions: string[] = [];
        let variables: [string, string[]][] = [];
        let rules: [string, string, string, string[]][] = [];
        model.hazards.forEach(hazard => {
            hazards.push(hazard.name);
        })
        model.controlStructure.nodes.forEach(element => {
            element.actions.forEach(action => {
                action.comms.forEach(command => {
                    actions.push(command.name);
                })
            })
            element.variables.forEach(variable => {
                variables.push([variable.name, variable.values]);
            })
        });
        const modelRules = model.rules;
        modelRules.forEach(rule => {
            if (rule.action.ref?.name) {
                rules.push([rule.name, rule.action.ref!.name, rule.type.value, rule.values]);
            }
        })
        return [rules, actions, variables] as const;
    }
}