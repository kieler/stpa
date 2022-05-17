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

import { Action, applyBounds, DiagramServer, DiagramServices, JsonMap, RequestAction, RequestModelAction, ResponseAction, RequestBoundsAction, ComputedBoundsAction } from 'sprotty-protocol'
import { SetSynthesisOptionsAction, UpdateOptionsAction } from './options/actions'
import { StpaSynthesisOptions } from './options/synthesis-options';
import { Template, TestTemplate } from './templates/templates';

export class StpaDiagramServer extends DiagramServer {

    private stpaOptions: StpaSynthesisOptions;
    private clientId: string;
    private options: JsonMap | undefined;
    private templates: Template[];

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, synthesisOptions: StpaSynthesisOptions, clientId: string, options: JsonMap | undefined) {
        super(dispatch, services);
        this.stpaOptions = synthesisOptions;
        this.clientId = clientId;
        this.options = options;
        this.templates = [TestTemplate]
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
            const opt = this.stpaOptions.getSynthesisOptions().find(synOpt => synOpt.synthesisOption.id == option.id);
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
        // send the avaiable syntheses options to the client before handling the request model action
        const test =this.templates[0].graph
/*         this.dispatch({
            kind: RequestBoundsAction.KIND,
            newRoot: this.templates[0].graph
        } as RequestBoundsAction) */

        const request = RequestBoundsAction.create(test);
        const response = await this.request<ComputedBoundsAction>(request);
        applyBounds(test, response);
        const newRoot = await this.layoutEngine?.layout(test);
        this.templates[0].graph = newRoot!

        this.dispatch({ kind: UpdateOptionsAction.KIND, valuedSynthesisOptions: this.stpaOptions.getSynthesisOptions(), templates: this.templates, clientId: this.clientId });
        super.handleRequestModel(action);
    }

}