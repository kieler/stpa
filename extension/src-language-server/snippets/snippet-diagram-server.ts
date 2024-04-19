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

import {
    Action,
    applyBounds,
    ComputedBoundsAction,
    DiagramServer,
    DiagramServices,
    JsonMap,
    RequestBoundsAction,
    RequestModelAction,
} from "sprotty-protocol";
import { Connection } from "vscode-languageserver";
import {
    AddSnippetAction,
    ExecuteSnippetAction,
    RequestWebviewSnippetsAction,
    SendSnippetsAction,
    SendWebviewSnippetsAction,
} from "./actions";
import { LanguageSnippet, SnippetGraphGenerator, WebviewSnippet } from "./snippet-model";

export abstract class SnippetDiagramServer extends DiagramServer {
    protected clientId: string;
    protected snippets: LanguageSnippet[] = [];
    protected defaultTemps: LanguageSnippet[];
    protected options: JsonMap | undefined;
    protected connection: Connection | undefined;
    protected snippetGraphGenerator: SnippetGraphGenerator;
    protected tempRdy: boolean = false;

    constructor(
        dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices,
        clientId: string,
        snippets: LanguageSnippet[],
        options: JsonMap | undefined,
        connection: Connection | undefined
    ) {
        super(dispatch, services);
        this.clientId = clientId;
        this.options = options;
        this.connection = connection;
        this.defaultTemps = snippets;
        this.snippetGraphGenerator = services.DiagramGenerator as SnippetGraphGenerator;
    }

    /**
     * Returns the snippets that should be send to the webview for rendering.
     */
    protected async getSnippets(): Promise<WebviewSnippet[]> {
        const webviewSnippets: WebviewSnippet[] = [];
        for (const snippet of this.snippets) {
            let graph = await this.snippetGraphGenerator.generateSnippetRoot(snippet);
            if (graph) {
                const request = RequestBoundsAction.create(graph);
                const response = await this.request<ComputedBoundsAction>(request);
                applyBounds(graph, response);
                const newRoot = await this.layoutEngine?.layout(graph);
                if (newRoot) {
                    graph = newRoot;
                }
                const webTemp = {
                    graph: graph,
                    id: snippet.id,
                };
                webviewSnippets.push(webTemp);
            } else {
                console.log("For snippet " + snippet.id + " no graph could be generated.");
            }
        }
        return webviewSnippets;
    }

    protected handleAction(action: Action): Promise<void> {
        switch (action.kind) {
            case ExecuteSnippetAction.KIND:
                return this.handleExecuteSnippet(action as ExecuteSnippetAction);
            case AddSnippetAction.KIND:
                return this.handleAddSnippet(action as AddSnippetAction);
            case SendSnippetsAction.KIND:
                return this.handleSendSnippets(action as SendSnippetsAction);
        }
        return super.handleAction(action);
    }

    /**
     * Creates a snippet based on {@code action} and adds it to the snippet list & config.
     * @param action Action containing the text to create a snippet.
     * @returns
     */
    protected async handleAddSnippet(action: AddSnippetAction): Promise<void> {
        const temp = this.createSnippetFromString(action.text);
        if (await this.parseable(temp)) {
            this.snippetGraphGenerator.deleteDanglingEdges(temp);
            this.addSnippets([temp]);
            this.connection?.sendNotification("config/add", [temp.baseCode]);
        } else {
            this.connection?.sendNotification("snippets/creationFailed");
        }
        return Promise.resolve();
    }

    /**
     * Determines if a snippet is parseable i.e. an AST can be created.
     * @param snippet The snippet to check.
     * @returns whether the snippet is parseable.
     */
    protected async parseable(snippet: LanguageSnippet): Promise<boolean> {
        const graph = await this.snippetGraphGenerator.generateSnippetRoot(snippet);
        if (graph) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Creates snippets based on the texts in {@code action} and updates the webview.
     * @param action Action containing the snippets texts.
     * @returns
     */
    protected handleSendSnippets(action: SendSnippetsAction): Promise<void> {
        // if no snippets are in the config file, add the default ones
        if (action.snippets.length === 0) {
            this.snippets = this.defaultTemps;
            this.connection?.sendNotification(
                "config/add",
                this.defaultTemps.map(temp => temp.baseCode)
            );
        } else {
            this.snippets = action.snippets.map(temp => this.createSnippetFromString(temp));
        }
        this.update();
        return Promise.resolve();
    }

    /**
     * Creates snippets based on the given {@code text}.
     * @param text The text to create the snippets from.
     * @returns a snippet created from the text.
     */
    protected abstract createSnippetFromString(text: string): LanguageSnippet;

    /**
     * Adds the given snippets to the snippet list and updates the webview.
     * @param temps The snippets to add.
     */
    addSnippets(temps: LanguageSnippet[]): void {
        this.snippets.push(...temps);
        this.update();
    }

    /**
     * Updates the webview with the current snippets.
     */
    async update(): Promise<void> {
        const temps = await this.getSnippets();
        // send the avaiable snippets to the client to get them rendered
        const response = await this.request<SendWebviewSnippetsAction>({
            kind: RequestWebviewSnippetsAction.KIND,
            snippets: temps,
            clientId: this.clientId,
        } as RequestWebviewSnippetsAction);
        // send graph svgs to extension
        this.connection?.sendNotification("snippets/add", { snippets: response.snippets });
    }

    /**
     * Adds the text of the snippet in {@code action} to the editor.
     * @param action 
     */
    protected async handleExecuteSnippet(action: ExecuteSnippetAction): Promise<void> {
        // uri of the file in which the snippet should be inserted
        const uri = this.options?.sourceUri;
        const temp = this.snippets.find(temp => temp.id === action.id);
        if (temp) {
            // determine position where to add
            const pos = temp.getPosition(uri as string);
            // add the text of the snippet to the editor
            this.connection?.sendNotification("editor/add", { uri: uri, text: temp.insertText, position: pos });
        } else {
            console.error("There is no Diagram Snippet with id " + action.id);
        }
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        // options must be updated since the request could be for another source model
        this.options = action.options;
        super.handleRequestModel(action);
    }
}
