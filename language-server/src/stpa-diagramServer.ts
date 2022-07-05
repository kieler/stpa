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

import { Action, DiagramServices, JsonMap, RequestAction, RequestModelAction, ResponseAction } from 'sprotty-protocol';
import { AddTemplateAction, UpdateViewAction } from './actions';
import { Connection } from 'vscode-languageserver';
import { SetSynthesisOptionsAction, UpdateOptionsAction } from './options/actions';
import { StpaSynthesisOptions } from './options/synthesis-options';
import { TemplateDiagramServer } from './templates/template-diagram-server';
import { StpaTemplates } from './stpa-templates';

export class StpaDiagramServer extends TemplateDiagramServer {

    protected stpaOptions: StpaSynthesisOptions;
    protected stpaTemps: StpaTemplates;
    clientId: string;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, synthesisOptions: StpaSynthesisOptions, clientId: string, options: JsonMap | undefined, connection: Connection | undefined, stpaTemps: StpaTemplates) {
        super(dispatch, services, clientId, stpaTemps.getTemplates(), options, connection);
        this.stpaTemps = stpaTemps;
        this.stpaOptions = synthesisOptions;
        this.clientId = clientId;
        // send the avaiable syntheses options to the client
        this.dispatch({ kind: UpdateOptionsAction.KIND, valuedSynthesisOptions: this.stpaOptions.getSynthesisOptions(), clientId: this.clientId });
    }

    accept(action: Action): Promise<void> {
        console.log("received from client: " + action.kind);
        return super.accept(action);
    }

    request<Res extends ResponseAction>(action: RequestAction<Res>): Promise<Res> {
        console.log("request send from server to client: " + action.kind);
        return super.request(action);
    }

    protected handleAction(action: Action): Promise<void> {
        switch (action.kind) {
            case SetSynthesisOptionsAction.KIND:
                return this.handleSetSynthesisOption(action as SetSynthesisOptionsAction);
            case UpdateViewAction.KIND:
                return this.handleUpdateView(action as UpdateViewAction);
            case AddTemplateAction.KIND:
                return this.handleAddTemplate(action as AddTemplateAction);
        }
        return super.handleAction(action);
    }

    protected handleAddTemplate(action: AddTemplateAction) {
        const temp = this.stpaTemps.createTemp(action.text);
        this.addTemplate(temp);
        return Promise.resolve();
    }

    protected handleSetSynthesisOption(action: SetSynthesisOptionsAction): Promise<void> {
        // update syntheses options
        for (const option of action.options) {
            const opt = this.stpaOptions.getSynthesisOptions().find(synOpt => synOpt.synthesisOption.id === option.id);
            if (opt) {
                opt.currentValue = option.currentValue;
            }
        }
        const updateAction = {
            kind: UpdateViewAction.KIND,
            options: this.state.options
        } as UpdateViewAction;
        this.handleUpdateView(updateAction);
        return Promise.resolve();
    }

    protected async handleUpdateView(action: UpdateViewAction) {
        this.state.options = action.options;
        try {
            const newRoot = await this.diagramGenerator.generate({
                options: this.state.options ?? {},
                state: this.state
            });
            newRoot.revision = ++this.state.revision;
            this.state.currentRoot = newRoot;
            await this.submitModel(this.state.currentRoot, true, action);
        } catch (err) {
            this.rejectRemoteRequest(action, err as Error);
            console.error('Failed to generate diagram:', err);
        }
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        super.handleRequestModel(action);
    }

}