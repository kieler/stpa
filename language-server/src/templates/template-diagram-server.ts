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
import { Template } from './template-model';

export class TemplateDiagramServer extends DiagramServer {

    protected clientId: string;
    protected templates: Template[];    
    protected options: JsonMap | undefined;
    protected connection: Connection | undefined;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, clientId: string, templates: Template[], options: JsonMap | undefined, connection: Connection | undefined) {
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
        // TODO: generic code + size computation + correct ordering of nodes
        const test = this.templates[0].graph;
        const request = RequestBoundsAction.create(test);
        const response = await this.request<ComputedBoundsAction>(request);
        applyBounds(test, response);
        const newRoot = await this.layoutEngine?.layout(test);
        this.templates[0].graph = newRoot!;
        // send the avaiable templates to the client
        this.dispatch({ kind: UpdateTemplatesAction.KIND, templates: this.templates, clientId: this.clientId });
    }

    protected handleAction(action: Action): Promise<void> {
        switch(action.kind) {
            case ExecuteTemplateAction.KIND:
                return this.handleExecuteTemplate(action as ExecuteTemplateAction);
        }
        return super.handleAction(action);
    }

    async handleExecuteTemplate(action: ExecuteTemplateAction): Promise<void> {
        const pos = {
            line: 0, character : 0
        };
        const uri = this.options?.sourceUri;

        this.connection?.sendNotification('editor/add', {uri: uri, text: action.code, position: pos});
        return;
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        super.handleRequestModel(action);
    }

}