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
import { ExecuteTemplateAction, UpdateTemplatesAction } from './actions';
import { LanguageTemplate, WebviewTemplate } from './template-model';

export class TemplateDiagramServer extends DiagramServer {

    protected clientId: string;
    protected templates: LanguageTemplate[];    
    protected options: JsonMap | undefined;
    protected connection: Connection | undefined;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, clientId: string, templates: LanguageTemplate[], options: JsonMap | undefined, connection: Connection | undefined) {
        super(dispatch, services);
        this.clientId = clientId;
        this.options = options;
        this.connection = connection;
        this.templates = templates;
        this.sendTemplates();
    }

    /**
     * Send the templates provided by the server to the client.
     */
    private async sendTemplates() {
        const webviewTemplates: WebviewTemplate[] = []
        for (const template of this.templates) {
            // TODO: size computation + correct ordering of nodes
            let graph = template.generateGraph();
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

        // send the avaiable templates to the client
        this.dispatch({ kind: UpdateTemplatesAction.KIND, templates: webviewTemplates, clientId: this.clientId });
    }

    protected handleAction(action: Action): Promise<void> {
        switch(action.kind) {
            case ExecuteTemplateAction.KIND:
                return this.handleExecuteTemplate(action as ExecuteTemplateAction);
        }
        return super.handleAction(action);
    }

    async handleExecuteTemplate(action: ExecuteTemplateAction): Promise<void> {
        const uri = this.options?.sourceUri;
        const temp = this.templates.find(temp => temp.id === action.id);
        if (temp) {
            this.connection?.sendNotification('editor/add', {uri: uri, text: temp.code, position: temp.getPosition(uri as string, action.x, action.y)});
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