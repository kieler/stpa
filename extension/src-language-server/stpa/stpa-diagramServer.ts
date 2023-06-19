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

import { Action, DiagramServer, DiagramServices, RequestAction, RequestModelAction, ResponseAction } from 'sprotty-protocol';
import { Connection } from 'vscode-languageserver';
import { UpdateViewAction } from '../actions';
import { SetSynthesisOptionsAction, UpdateOptionsAction } from '../options/actions';
import { DropDownOption } from '../options/option-models';
import { GenerateControlStructureAction, RequestSvgAction, SvgAction } from './actions';
import { StpaSynthesisOptions } from './synthesis-options';

export class StpaDiagramServer extends DiagramServer {

    protected stpaOptions: StpaSynthesisOptions;
    clientId: string;
    protected connection: Connection | undefined;

    constructor(dispatch: <A extends Action>(action: A) => Promise<void>,
        services: DiagramServices, synthesisOptions: StpaSynthesisOptions, clientId: string, connection: Connection | undefined) {
        super(dispatch, services);
        this.stpaOptions = synthesisOptions;
        this.clientId = clientId;
        this.connection = connection;
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
            case GenerateControlStructureAction.KIND:
                return this.handleGenerateControlStructure(action as GenerateControlStructureAction);
        }
        return super.handleAction(action);
    }

    async handleGenerateControlStructure(action: GenerateControlStructureAction): Promise<void> {
        const request = RequestSvgAction.create();
        const response = await this.request<SvgAction>(request);
        console.log("handleGenerateControlStructure:\n" + response.svg);
        this.connection?.sendNotification("svg", { uri: action.uri, svg: response.svg });
        return Promise.resolve();
    }

    protected handleSetSynthesisOption(action: SetSynthesisOptionsAction): Promise<void> {
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
        const updateAction = {
            kind: UpdateViewAction.KIND,
            options: this.state.options
        } as UpdateViewAction;
        this.handleUpdateView(updateAction);
        return Promise.resolve();
    }

    protected async handleUpdateView(action: UpdateViewAction): Promise<void> {
        this.state.options = action.options;
        try {
            const newRoot = await this.diagramGenerator.generate({
                options: this.state.options ?? {},
                state: this.state
            });
            newRoot.revision = ++this.state.revision;
            this.state.currentRoot = newRoot;
            await this.submitModel(this.state.currentRoot, true, action);
            // ensures the the filterUCA option is correct
            this.dispatch({ kind: UpdateOptionsAction.KIND, valuedSynthesisOptions: this.stpaOptions.getSynthesisOptions(), clientId: this.clientId });
        } catch (err) {
            this.rejectRemoteRequest(action, err as Error);
            console.error('Failed to generate diagram:', err);
        }
    }

    protected async handleRequestModel(action: RequestModelAction): Promise<void> {
        await super.handleRequestModel(action);
        this.dispatch({ kind: UpdateOptionsAction.KIND, valuedSynthesisOptions: this.stpaOptions.getSynthesisOptions(), clientId: this.clientId });
    }

}