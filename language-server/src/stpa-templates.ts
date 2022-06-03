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
import { TextDocument } from 'vscode-languageserver-textdocument';

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

/**
 * Calculates the actual text of templates for the control structure and theri position in the document.
 * @param document The document in which the template should be inserted.
 * @param template The template that should be inserted.
 * @returns The position where the tempalte should be added to the {@code document}.
 */
function getPositionForCSTemplate(document: TextDocument, template: LanguageTemplate): Position {
    // TODO: IDs must be unique even if the template is used more than once
    const docText = document.getText();

    // determine range of already existing definition of control structure
    const titleIndex = docText.indexOf('ControlStructure');
    const startIndex = titleIndex !== -1 ? titleIndex : 0;
    const nextTitleIndex = docText.indexOf('Responsibilities');
    const endIndex = nextTitleIndex !== -1 ? nextTitleIndex - 1 : docText.length - 1;
    if (titleIndex === -1) {
        template.insertText = template.baseCode;
        return document.positionAt(endIndex);
    } else {
        // check whether a graph ID already exist
        const csText = docText.substring(startIndex, endIndex);
        const graphIndex = csText.indexOf('{');
        // TODO: starting positions 19 and 23 may be incorrect for user provided templates
        if (graphIndex === -1) {
            template.insertText = template.baseCode.substring(19, template.baseCode.length);
            return document.positionAt(endIndex);
        } else {
            template.insertText = template.baseCode.substring(23, template.baseCode.length-3);
            const bracketIndex = csText.lastIndexOf('}');
            return document.positionAt(titleIndex + bracketIndex -1);
        }
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

const simpleCSWithActuatorsTemplateCode: string = 
`
ControlStructure 
CS {
    Controller {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> Actuator
        }
    }
    Actuator {
        hierarchyLevel 1
        controlActions {
            [caAc "control action"] -> ControlledProcess
        }
    }
    Sensor {
        hierarchyLevel 1
        feedback {
            [fbS "feedback"] -> Controller
        }
    }
    ControlledProcess {
        hierarchyLevel 2
        feedback {
            [fb "feedback"] -> Sensor
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
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        return getPositionForCSTemplate(document, this);
    }
};

/**
 * Template for tests
 */
export class TestTemplate2 implements LanguageTemplate {
    insertText = simpleCSWithActuatorsTemplateCode;
    baseCode = simpleCSWithActuatorsTemplateCode;
    documents: LangiumDocuments;
    id: string = 'simpleCSWithAcsTemplate';

    constructor(documents: LangiumDocuments) {
        this.documents = documents;
    }
    
    getPosition (uri: string): Position {
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        return getPositionForCSTemplate(document, this);
    }
};