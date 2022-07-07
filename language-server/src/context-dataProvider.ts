import { Uri } from "vscode";
import { LangiumDocuments, LangiumDocument } from "langium";
import { StpaServices } from "./stpa-module";
import { Model, Variable, VE } from "./generated/ast";
import { Connection } from "vscode-languageserver";

export class ContextTableProvider {
    protected readonly textDocuments: LangiumDocuments;
    protected readonly connection: Connection | undefined;
    private uri: Uri;

    constructor(services: StpaServices) {
        this.textDocuments = services.shared.workspace.LangiumDocuments;
        this.connection = services.shared.lsp.Connection;

        this.connection?.onNotification('contextTable/uri', uri => {
            this.getUri(uri);
            this.connection?.sendNotification('contextTable/data', this.getContext());
        });
    }

    getUri(sentUri: Uri) {
        this.uri = sentUri;
    }

    getContext() {
        const currentDoc = this.textDocuments.getOrCreateDocument(this.uri) as LangiumDocument<Model>;
        const model: Model = currentDoc.parseResult.value;

        const hazards = model.hazards;
        const actionNodes = model.controlStructure.nodes
        let actions: VE[] = [];
        let variables: Variable[] = [];
        actionNodes.forEach(element => {
            actions = actions.concat(element.actions);
            variables = variables.concat(element.variables);
        });
        return [hazards, actions, variables] as const;
    }
}