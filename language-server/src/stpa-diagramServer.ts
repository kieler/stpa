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
import { Connection } from 'vscode-languageserver';
import { SetSynthesisOptionsAction, UpdateOptionsAction } from './options/actions';
import { StpaSynthesisOptions } from './options/synthesis-options';
import { TemplateDiagramServer } from './templates/template-diagram-server';
import { Template } from './templates/template-model';

export class StpaDiagramServer extends TemplateDiagramServer {

    private stpaOptions: StpaSynthesisOptions;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, synthesisOptions: StpaSynthesisOptions, clientId: string, options: JsonMap | undefined, connection: Connection | undefined, templates: Template[]) {
        super(dispatch, services, clientId, templates, options, connection);
        this.stpaOptions = synthesisOptions;
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
        switch(action.kind) {
            case SetSynthesisOptionsAction.KIND: 
                return this.handleSetSynthesisOption(action as SetSynthesisOptionsAction);
        }
        return super.handleAction(action);
    }

    handleSetSynthesisOption(action: SetSynthesisOptionsAction): Promise<void> {
        // update syntheses options
        for (const option of action.options) {
            const opt = this.stpaOptions.getSynthesisOptions().find(synOpt => synOpt.synthesisOption.id === option.id);
            if (opt) {
                opt.currentValue = option.currentValue;
            }
        }
        // request the new model
        const requestAction = {
                kind: RequestModelAction.KIND,
                options: this.options
            } as RequestModelAction;
        this.handleRequestModel(requestAction);
        return Promise.resolve();
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        super.handleRequestModel(action);
    }

}