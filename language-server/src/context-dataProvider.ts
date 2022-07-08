import { Uri } from "vscode";
import { LangiumDocuments, LangiumDocument } from "langium";
import { StpaServices } from "./stpa-module";
import { Model } from "./generated/ast";

export class ContextTableProvider {
    protected readonly textDocuments: LangiumDocuments;
    private uri: Uri;

    constructor(services: StpaServices) {
        this.textDocuments = services.shared.workspace.LangiumDocuments;
    }

    getUri(sentUri: Uri) {
        this.uri = sentUri;
    }

    getContext() {
        const currentDoc = this.textDocuments.getOrCreateDocument(this.uri) as LangiumDocument<Model>;
        const model: Model = currentDoc.parseResult.value;

        let hazards : string[] = [];
        let actions: string[] = [];
        let variables: string[] = [];
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
                variables.push(variable.name);
            })
        });
        return [hazards, actions, variables] as const;
    }
}