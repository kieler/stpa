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

import { Action, DiagramServer, DiagramServices, JsonMap, RequestAction, RequestModelAction, ResponseAction } from 'sprotty-protocol';
import { SetSynthesisOptionsAction, UpdateOptionsAction } from './options/actions';
import { StpaSynthesisOptions } from './options/synthesis-options';

export class StpaDiagramServer extends DiagramServer {

    private stpaOptions: StpaSynthesisOptions;
    private clientId: string;
    private options: JsonMap | undefined;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, synthesisOptions: StpaSynthesisOptions, clientId: string, options: JsonMap | undefined) {
        super(dispatch, services);
        this.stpaOptions = synthesisOptions;
        this.clientId = clientId;
        this.options = options;
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
        for (const option of action.options) {
            const opt = this.stpaOptions.getSynthesisOptions().find(synOpt => synOpt.synthesisOption.id === option.id);
            if (opt) {
                opt.currentValue = option.currentValue;
            }
        }
        const requestAction = {
                kind: RequestModelAction.KIND,
                options: this.options
            } as RequestModelAction;
        this.handleRequestModel(requestAction);
        return Promise.resolve();
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        this.dispatch({ kind: UpdateOptionsAction.KIND, valuedSynthesisOptions: this.stpaOptions.getSynthesisOptions(), clientId: this.clientId });
        super.handleRequestModel(action);
    }

}