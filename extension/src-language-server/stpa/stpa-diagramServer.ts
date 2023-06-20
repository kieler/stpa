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
import { GenerateSVGsAction, RequestSvgAction, SvgAction } from './actions';
import { COMPLETE_GRAPH_PATH, CONTROLLER_CONSTRAINT_PATH, CONTROL_STRUCTURE_PATH, HAZARD_PATH, RESPONSIBILITY_PATH, SAFETY_REQUIREMENT_PATH, SCENARIO_PATH, SYSTEM_CONSTRAINT_PATH, resetOptions, saveOptions, setControlStructureOptions, setControllerConstraintGraphOptions, setFilteredUcaGraphOptions, setHazardGraphOptions, setRelationshipGraphOptions, setResponsibilityGraphOptions, setSafetyRequirementGraphOptions, setScenarioGraphOptions, setSystemConstraintGraphOptions } from './result-report/svg-generator';
import { StpaSynthesisOptions, filteringUCAsID } from './synthesis-options';

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
            case GenerateSVGsAction.KIND:
                return this.handleGenerateSVGDiagrams(action as GenerateSVGsAction);
        }
        return super.handleAction(action);
    }



    async handleGenerateSVGDiagrams(action: GenerateSVGsAction): Promise<void> {
        diagramSizes = {};
        const setSynthesisOption = {
            kind: SetSynthesisOptionsAction.KIND,
            options: this.stpaOptions.getSynthesisOptions().map(option => option.synthesisOption)
        } as SetSynthesisOptionsAction;
        saveOptions(this.stpaOptions);
        // control structure svg
        setControlStructureOptions(this.stpaOptions);
        await this.createSVG(setSynthesisOption, action.uri, CONTROL_STRUCTURE_PATH);
        // hazard graph svg
        setHazardGraphOptions(this.stpaOptions);
        await this.createSVG(setSynthesisOption, action.uri, HAZARD_PATH);
        // system constraint graph svg
        setSystemConstraintGraphOptions(this.stpaOptions);
        await this.createSVG(setSynthesisOption, action.uri, SYSTEM_CONSTRAINT_PATH);
        // responsibility graph svg
        setResponsibilityGraphOptions(this.stpaOptions);
        await this.createSVG(setSynthesisOption, action.uri, RESPONSIBILITY_PATH);

        // filtered uca graph svg
        const filteringUcaOption = this.stpaOptions.getSynthesisOptions().find(option => option.synthesisOption.id === filteringUCAsID);
        for (const value of (filteringUcaOption?.synthesisOption as DropDownOption).availableValues) {
            setFilteredUcaGraphOptions(this.stpaOptions, value.id);
            await this.createSVG(setSynthesisOption, action.uri, "/" + value.id.replace(".", "-").replace(" ", "-") + ".svg");
        }

        // controller constraint graph svg
        setControllerConstraintGraphOptions(this.stpaOptions);
        await this.createSVG(setSynthesisOption, action.uri, CONTROLLER_CONSTRAINT_PATH);
        // scenario svg graph
        setScenarioGraphOptions(this.stpaOptions);
        await this.createSVG(setSynthesisOption, action.uri, SCENARIO_PATH);
        // safety requirement svg graph
        setSafetyRequirementGraphOptions(this.stpaOptions);
        await this.createSVG(setSynthesisOption, action.uri, SAFETY_REQUIREMENT_PATH);
        // complete graph svg
        setRelationshipGraphOptions(this.stpaOptions);
        await this.createSVG(setSynthesisOption, action.uri, COMPLETE_GRAPH_PATH);
        // reset options
        resetOptions(this.stpaOptions);
        await this.handleSetSynthesisOption(setSynthesisOption);
        return Promise.resolve();
    }

    protected async createSVG(action: SetSynthesisOptionsAction | undefined, uri: string, id: string): Promise<void> {
        if (action) {
            await this.handleSetSynthesisOption(action);
            const request = RequestSvgAction.create();
            const response = await this.request<SvgAction>(request);
            diagramSizes[id] = response.width;
            this.connection?.sendNotification("svg", { uri: uri + id, svg: response.svg });
        }
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
        const updateAction = {
            kind: UpdateViewAction.KIND,
            options: this.state.options
        } as UpdateViewAction;
        await this.handleUpdateView(updateAction);
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

export let diagramSizes: Record<string, number> = {};