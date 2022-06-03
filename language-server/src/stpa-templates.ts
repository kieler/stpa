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

import { Position } from 'vscode-languageserver';
import { LanguageTemplate } from './templates/template-model';
import { LangiumDocuments, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

export class StpaTemplates {

    protected readonly langiumDocuments: LangiumDocuments;
    protected defaultTemplates: LanguageTemplate[];
    protected templates: LanguageTemplate[];

    constructor(services: LangiumServices) {
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.defaultTemplates = this.generateDefaultTemplates();
        this.templates = this.defaultTemplates;
    }

    /**
     * Creates the default templates.
     * @returns A list with the default templates.
     */
    protected generateDefaultTemplates() {
        return [
            new SimpleCSTemplate(this.langiumDocuments),
            new TestTemplate2(this.langiumDocuments)
        ];
    }

    getTemplates() {
        return this.templates;
    }

}

const simpleCSTemplateCode: string = 
`
ControlStructure 
CS {
    Controller {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> ControlledProcess
        }
    }
    ControlledProcess {
        hierarchyLevel 1
        feedback {
            [fb "feedback"] -> Controller
        }
    }
}
`;

/**
 * Template for a control structure with one controller and one controlled process.
 */
export class SimpleCSTemplate implements LanguageTemplate {
    insertText = simpleCSTemplateCode;
    documents: LangiumDocuments;
    id: string = 'simpleCSTemplate';
    baseCode = simpleCSTemplateCode;

    constructor(documents: LangiumDocuments) {
        this.documents = documents;
    }

    getPosition (uri: string): Position {
        // TODO: title could be written but no graph name
        // TODO: IDs must be unique even if the template is used more than once
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        const docText = document.getText();

        // if there is already a control structure, the title and a graph name must be deleted
        const titleIndex = docText.indexOf('ControlStructure');
        if (titleIndex !== -1) {
            this.insertText = this.baseCode.substring(23, this.baseCode.length-3);
        } else {
            this.insertText = this.baseCode;
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

/**
 * Template for tests
 */
export class TestTemplate2 implements LanguageTemplate {
    insertText = 'Losses\nL1 "test"';
    baseCode = 'Losses\nL1 "test"';
    documents: LangiumDocuments;
    id: string = 'tempGraph2';

    constructor(documents: LangiumDocuments) {
        this.documents = documents;
    }
    
    getPosition (uri: string): Position {
        return {
            line: 0,
            character: 0
        };
    }
};