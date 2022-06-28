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

import { Action, applyBounds, ComputedBoundsAction, DiagramServer, DiagramServices, JsonMap, RequestBoundsAction, RequestModelAction } from 'sprotty-protocol';
import { Connection } from 'vscode-languageserver';
import { ExecuteTemplateAction, TemplateWebviewRdyAction, RequestWebviewTemplatesAction, SendWebviewTemplatesAction } from './actions';
import { LanguageTemplate, TemplateGraphGenerator, WebviewTemplate } from './template-model';

export class TemplateDiagramServer extends DiagramServer {

    protected clientId: string;
    protected templates: LanguageTemplate[];    
    protected options: JsonMap | undefined;
    protected connection: Connection | undefined;
    protected templateGraphGenerator: TemplateGraphGenerator;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, clientId: string, templates: LanguageTemplate[], options: JsonMap | undefined, connection: Connection | undefined) {
        super(dispatch, services);
        this.clientId = clientId;
        this.options = options;
        this.connection = connection;
        this.templates = templates;
        this.templateGraphGenerator = services.DiagramGenerator as TemplateGraphGenerator;
    }

    /**
     * Send the templates provided by the server to the client.
     */
    protected async getTemplates() {
        const webviewTemplates: WebviewTemplate[] = [];
        for (const template of this.templates) {
            // TODO: correct ordering of nodes
            let graph = await this.templateGraphGenerator.generateTemplateRoot(template);
            const request = RequestBoundsAction.create(graph);
            const response = await this.request<ComputedBoundsAction>(request);
            applyBounds(graph, response);
            const newRoot = await this.layoutEngine?.layout(graph);
            if (newRoot) {
                graph = newRoot;
            }
            const webTemp = {
                graph: graph,
                id: template.id
            };
            webviewTemplates.push(webTemp);
        }
        return webviewTemplates;

    }

    protected handleAction(action: Action): Promise<void> {
        switch(action.kind) {
            case ExecuteTemplateAction.KIND:
                return this.handleExecuteTemplate(action as ExecuteTemplateAction);
            case TemplateWebviewRdyAction.KIND:
                return this.handleTemplateWebviewRdy();
        }
        return super.handleAction(action);
    }
    
    protected async handleTemplateWebviewRdy(): Promise<void> {
        const temps = await this.getTemplates();
        // send the avaiable templates to the client
        const response = await this.request<SendWebviewTemplatesAction>({ kind: RequestWebviewTemplatesAction.KIND, templates: temps, clientId: this.clientId }as RequestWebviewTemplatesAction);
        // send graph svgs to extension
        this.connection?.sendNotification('templates/add', {templates: response.templates});
    }

    protected async handleExecuteTemplate(action: ExecuteTemplateAction): Promise<void> {
        const uri = this.options?.sourceUri;
        const temp = this.templates.find(temp => temp.id === action.id);
        if (temp) {
            const pos = temp.getPosition(uri as string);
            this.connection?.sendNotification('editor/add', {uri: uri, text: temp.insertText, position: pos});
        } else {
            console.error('There is no Template with id ' + action.id);
        }
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        // options must be updated since the request could be for another source model
        this.options = action.options;
        super.handleRequestModel(action);
    }

}