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

import { /* ModelLayoutOptions, */ SGraph, SLabel, SModelElement } from 'sprotty-protocol';
import { Position } from 'vscode-languageserver';
import { CSEdge, CSNode } from './STPA-interfaces';
import { CS_EDGE_TYPE, CS_NODE_TYPE, EdgeDirection } from './stpa-model';
import { LanguageTemplate } from './templates/template-model';
import { LangiumDocuments, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

export class StpaTemplates {

    protected readonly langiumDocuments: LangiumDocuments;
    protected defaultTemplates: LanguageTemplate[];
    protected templates: LanguageTemplate[];

    constructor(services: LangiumServices) {
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.defaultTemplates =  [new SimpleCSTemplate(this.langiumDocuments), new TestTemplate2(this.langiumDocuments)];
        this.templates = this.defaultTemplates;
    }

    getTemplates() {
        return this.templates;
    }

}

const simpleCSTemplateGraph: Readonly<SModelElement> = {
    type: 'graph',
    id: 'simpleCSTemplate',
/*     layoutOptions: {
        'org.eclipse.elk.separateConnectedComponents': 'false',
        'org.eclipse.elk.layered.crossingMinimization.semiInteractive': 'true',
        'cycleBreaking.strategy': 'INTERACTIVE',
        'layering.strategy': 'INTERACTIVE'
    } as ModelLayoutOptions, */
    children: [
        {
            type: CS_NODE_TYPE,
            id: 'tempnode1',
            layout: 'stack',
            children: [
                {
                    type:'label',
                    id: 'tempLabel1',
                    text: 'Controller'
                } as SLabel
            ]
        } as CSNode,
        {
            type: CS_NODE_TYPE,
            id: 'tempnode2',
            layout: 'stack',
            children: [
                {
                    type:'label',
                    id: 'tempLabel2',
                    text: 'Controlled Process'
                } as SLabel
            ]
        } as CSNode,
        {
            type: CS_EDGE_TYPE,
            id: 'tempedge1',
            sourceId: 'tempnode1',
            targetId: 'tempnode2',
            direction: EdgeDirection.DOWN,
            children: [
                {
                    type:'label:xref',
                    id: 'tempLabel3',
                    text: 'control action'
                } as SLabel
            ]
        } as CSEdge,
        {
            type: CS_EDGE_TYPE,
            id: 'tempedge2',
            sourceId: 'tempnode2',
            targetId: 'tempnode1',
            direction: EdgeDirection.UP,
            children: [
                {
                    type:'label:xref',
                    id: 'tempLabel4',
                    text: 'feedback'
                } as SLabel
            ]
        } as CSEdge
    ] as SModelElement[],
    zoom: 0.8,
    scroll: {x:0, y:0},
} as SGraph;

const testGraph2: Readonly<SModelElement> = {
    type: 'graph',
    id: 'tempGraph2',
    children: [
        {
            type: CS_NODE_TYPE,
            id: 'tempnode21',
            layout: 'stack',
            children: [
                {
                    type:'label',
                    id: 'tempLabel21',
                    text: 'Component'
                } as SLabel
            ]
        } as CSNode
    ] as SModelElement[],
    zoom: 0.8,
    scroll: {x:0, y:0},
} as SGraph;

const simpleCSTemplateCode: string = '\nController {\n    hierarchyLevel 0\n    controlActions {\n        [ca "control action"] -> ControlledProcess\n    }\n}\nControlledProcess {\n    hierarchyLevel 1\n    feedback {\n        [fb "feedback"] -> Controller\n    }\n}\n';

export class SimpleCSTemplate implements LanguageTemplate {
    code = simpleCSTemplateCode;
    documents: LangiumDocuments;
    id: string = 'simpleCSTemplate';
    insertText = simpleCSTemplateCode;

    constructor(documents: LangiumDocuments) {
        this.documents = documents;
    }

    generateGraph(): Readonly<SModelElement> {
        // TODO: generate graph automatically based on the code
        return simpleCSTemplateGraph;
    }

    getPosition (uri: string, x: number, y: number): Position {
        // TODO: x and y should be considered when placing the text in the editor
        // TODO: title could be written but no graph name
        // TODO: IDs must be unique even if the template is used more than once
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        const docText = document.getText();

        // if there is not contorl structure so far, the title and a graph name must be added too
        const titleIndex = docText.indexOf('ControlStructure');
        if (titleIndex === -1) {
            this.code = 'ControlStructure\nCS {' + this.insertText + '}';
        } else {
            this.code = this.insertText;
        }
        // determine position for the text to insert
        const nextTitleIndex = docText.indexOf('Responsibilities');
        const endIndex = nextTitleIndex !== -1 ? nextTitleIndex - 1 : docText.length - 1;
        if (titleIndex === -1) {
            return document.positionAt(endIndex);
        } else {
            const csText = docText.substring(titleIndex, endIndex);
            const bracketIndex = csText.lastIndexOf('}');
            return document.positionAt(titleIndex + bracketIndex -1);
        }
    }
};

export class TestTemplate2 implements LanguageTemplate {
    code = 'testString2';
    documents: LangiumDocuments;
    id: string = 'tempGraph2';

    constructor(documents: LangiumDocuments) {
        this.documents = documents;
    }
    generateGraph(): Readonly<SModelElement> {
        return testGraph2;
    }
    
    getPosition (uri: string, x: number, y: number): Position {
        return {
            line: 0,
            character: 0
        };
    }
};