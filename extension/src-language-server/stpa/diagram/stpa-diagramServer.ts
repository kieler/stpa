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

import { StpaSynthesisOptions } from './synthesis-options';
import { SetSynthesisOptionsAction, UpdateOptionsAction } from '../../options/actions';
import { DropDownOption } from '../../options/option-models';

export class StpaDiagramServer extends DiagramServer {

    protected stpaOptions: StpaSynthesisOptions;
    clientId: string;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, synthesisOptions: StpaSynthesisOptions, clientId: string) {
        super(dispatch, services);
        this.stpaOptions = synthesisOptions;
        this.clientId = clientId;
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
        }
        return super.handleAction(action);
    }

    protected async handleSetSynthesisOption(action: SetSynthesisOptionsAction): Promise<void> {
        for (const option of action.options) {
            const opt = this.stpaOptions.getSynthesisOptions().find(synOpt => synOpt.synthesisOption.id === option.id);
            if (opt) {
                opt.currentValue = option.currentValue;
                // for dropdown menu options more must be done
                if ((opt.synthesisOption as DropDownOption).currentId) {
                    (opt.synthesisOption as DropDownOption).currentId = option.currentValue;
                    this.dispatch({ kind: UpdateOptionsAction.KIND, valuedSynthesisOptions: this.stpaOptions.getSynthesisOptions(), clientId: this.clientId });
                }
            }
        }
        await this.updateView(this.state.options);
        return Promise.resolve();
    }

    protected async updateView(options: JsonMap | undefined): Promise<void> {
        this.state.options = options;
        try {
            const newRoot = await this.diagramGenerator.generate({
                options: this.state.options ?? {},
                state: this.state
            });
            newRoot.revision = ++this.state.revision;
            this.state.currentRoot = newRoot;
            await this.submitModel(this.state.currentRoot, true);
            // ensures the the filterUCA option is correct
            this.dispatch({ kind: UpdateOptionsAction.KIND, valuedSynthesisOptions: this.stpaOptions.getSynthesisOptions(), clientId: this.clientId });
        } catch (err) {
            this.rejectRemoteRequest(undefined, err as Error);
            console.error('Failed to generate diagram:', err);
        }
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        await super.handleRequestModel(action);
        this.dispatch({ kind: UpdateOptionsAction.KIND, valuedSynthesisOptions: this.stpaOptions.getSynthesisOptions(), clientId: this.clientId });
    }

}