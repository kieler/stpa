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
import { AddTemplateAction } from '../actions';
import { ExecuteTemplateAction, RequestWebviewTemplatesAction, SendWebviewTemplatesAction, SendTemplatesAction } from './actions';
import { LanguageTemplate, TemplateGraphGenerator, WebviewTemplate } from './template-model';

export abstract class TemplateDiagramServer extends DiagramServer {

    protected clientId: string;
    protected templates: LanguageTemplate[] = [];
    protected defaultTemps: LanguageTemplate[];
    protected options: JsonMap | undefined;
    protected connection: Connection | undefined;
    protected templateGraphGenerator: TemplateGraphGenerator;
    protected tempRdy: boolean = false;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, clientId: string, templates: LanguageTemplate[], options: JsonMap | undefined, connection: Connection | undefined) {
        super(dispatch, services);
        this.clientId = clientId;
        this.options = options;
        this.connection = connection;
        this.defaultTemps = templates;
        this.templateGraphGenerator = services.DiagramGenerator as TemplateGraphGenerator;
    }

    /**
     * Returns the templates that should be send to the webview for rendering.
     */
    protected async getTemplates() {
        const webviewTemplates: WebviewTemplate[] = [];
        for (const template of this.templates) {
            let graph = await this.templateGraphGenerator.generateTemplateRoot(template);
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
                    id: template.id
                };
                webviewTemplates.push(webTemp);
            } else {
                console.log("For template " + template.id + " no graph could be generated.");
            }
        }
        return webviewTemplates;

    }

    protected handleAction(action: Action): Promise<void> {
        switch (action.kind) {
            case ExecuteTemplateAction.KIND:
                return this.handleExecuteTemplate(action as ExecuteTemplateAction);
            case AddTemplateAction.KIND:
                return this.handleAddTemplate(action as AddTemplateAction);
            case SendTemplatesAction.KIND:
                return this.handleSendTemplates(action as SendTemplatesAction);
        }
        return super.handleAction(action);
    }

    /**
     * Creates a template based on {@code action} and adds it to the template list & config.
     * @param action Action containing the text to create a template.
     * @returns 
     */
    protected async handleAddTemplate(action: AddTemplateAction) {
        const temp = this.createTempFromString(action.text);
        if (await this.parseable(temp)) {
            this.templateGraphGenerator.deleteDanglingEdges(temp);
            this.addTemplates([temp]);
            this.connection?.sendNotification('config/add', [temp.baseCode]);
        } else {
            this.connection?.sendNotification('templates/creationFailed');
        }
        return Promise.resolve();
    }

    protected async parseable(template: LanguageTemplate) {
        let graph = await this.templateGraphGenerator.generateTemplateRoot(template);
        if (graph) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Creates templates based on the texts in {@code action}.
     * @param action Action containing the template texts.
     * @returns 
     */
    protected handleSendTemplates(action: SendTemplatesAction) {
        // if no templates are in the config file, add the default ones
        if (action.temps.length === 0) {
            this.templates = this.defaultTemps;
            this.connection?.sendNotification('config/add', this.defaultTemps.map(temp => temp.baseCode));
        } else {
            this.templates = action.temps.map(temp => this.createTempFromString(temp));
        }
        this.update();
        return Promise.resolve();
    }

    protected abstract createTempFromString(text: string): LanguageTemplate;

    addTemplates(temps: LanguageTemplate[]) {
        this.templates.push(...temps);
        this.update();
    }

    async update() {
        const temps = await this.getTemplates();
        // send the avaiable templates to the client
        const response = await this.request<SendWebviewTemplatesAction>({ kind: RequestWebviewTemplatesAction.KIND, templates: temps, clientId: this.clientId } as RequestWebviewTemplatesAction);
        // send graph svgs to extension
        this.connection?.sendNotification('templates/add', { templates: response.templates });
    }

    protected async handleExecuteTemplate(action: ExecuteTemplateAction): Promise<void> {
        const uri = this.options?.sourceUri;
        const temp = this.templates.find(temp => temp.id === action.id);
        if (temp) {
            const pos = temp.getPosition(uri as string);
            this.connection?.sendNotification('editor/add', { uri: uri, text: temp.insertText, position: pos });
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