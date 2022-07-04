import { TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { StpaServices } from "./stpa-module";

export class ContextTableProvider {
    protected readonly textDocuments: TextDocuments<TextDocument>;

    constructor(services: StpaServices) {
        this.textDocuments = services.shared.workspace.TextDocuments;
    }
}