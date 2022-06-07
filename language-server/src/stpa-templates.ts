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
            new SimpleCSTemplate(this.langiumDocuments, "T0"),
            new SimpleCSWithAcsTemplate(this.langiumDocuments, "T1"),
            new ConsControllersTemplate(this.langiumDocuments, "T3"),
            new ParallelContsTemplate(this.langiumDocuments, "T4"),
            new ConsContsWithLoopTemplate(this.langiumDocuments, "T5")
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
    const docText = document.getText();

    // determine range of already existing definition of control structure
    const titleIndex = docText.indexOf('ControlStructure');
    const startIndex = titleIndex !== -1 ? titleIndex : 0;
    const nextTitleIndex = docText.indexOf('Responsibilities');
    const endIndex = nextTitleIndex !== -1 ? nextTitleIndex - 1 : docText.length - 1;
    if (titleIndex === -1) {
        return document.positionAt(endIndex);
    } else {
        // check whether a graph ID already exist
        const csText = docText.substring(startIndex, endIndex);
        const graphIndex = csText.indexOf('{');
        // TODO: starting positions 19 and 23 may be incorrect for user provided templates
        if (graphIndex === -1) {
            template.insertText = template.insertText.substring(18, template.insertText.length);
            return document.positionAt(endIndex);
        } else {
            template.insertText = template.insertText.substring(22, template.insertText.length-3);
            const bracketIndex = csText.lastIndexOf('}');
            return document.positionAt(titleIndex + bracketIndex -1);
        }
    }
    
}

/**
 * Template for a control structure with one controller and one controlled process.
 */
export class SimpleCSTemplate implements LanguageTemplate {
    insertText: string;
    documents: LangiumDocuments;
    id: string = 'simpleCSTemplate';
    protected counter: number = 0;
    protected shortId: string;
    baseCode: string = `
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

    constructor(documents: LangiumDocuments, shortId: string) {
        this.documents = documents;
        this.shortId = shortId;
    }

    protected generateCode(): string {
        return `
ControlStructure
CS {
    Controller` + this.shortId + this.counter +` {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> ControlledProcess` + this.shortId + this.counter +`
        }
    }
    ControlledProcess` + this.shortId + this.counter +` {
        hierarchyLevel 1
        feedback {
            [fb "feedback"] -> Controller` + this.shortId + this.counter +`
        }
    }
}
`;
    }

    getPosition (uri: string): Position {
        this.insertText = this.generateCode();
        this.counter++;
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        return getPositionForCSTemplate(document, this);
    }
};

/**
 * Template for a control structure with one controller, one controlled process, one actuator, and one sensor.
 */
export class SimpleCSWithAcsTemplate implements LanguageTemplate {
    insertText: string;
    documents: LangiumDocuments;
    id: string = 'simpleCSWithAcsTemplate';
    protected counter: number = 0;
    protected shortId: string;
    baseCode: string = `
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

    constructor(documents: LangiumDocuments, shortId: string) {
        this.documents = documents;
        this.shortId = shortId;
    }

    protected generateCode(): string {
        return `
ControlStructure
CS {
    Controller` + this.shortId + this.counter +` {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> Actuator` + this.shortId + this.counter +`
        }
    }
    Actuator` + this.shortId + this.counter +` {
        hierarchyLevel 1
        controlActions {
            [caAc "control action"] -> ControlledProcess` + this.shortId + this.counter +`
        }
    }
    Sensor` + this.shortId + this.counter +` {
        hierarchyLevel 1
        feedback {
            [fbS "feedback"] -> Controller` + this.shortId + this.counter +`
        }
    }
    ControlledProcess` + this.shortId + this.counter +` {
        hierarchyLevel 2
        feedback {
            [fb "feedback"] -> Sensor` + this.shortId + this.counter +`
        }
    }
}
`;
    }
    
    getPosition (uri: string): Position {
        this.insertText = this.generateCode();
        this.counter++;
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        return getPositionForCSTemplate(document, this);
    }
};

/**
 * Template for a control structure with two consecutive controllers and one controlled process.
 */
 export class ConsControllersTemplate implements LanguageTemplate {
    insertText: string;
    documents: LangiumDocuments;
    id: string = 'consControllerTemplate';
    protected counter: number = 0;
    protected shortId: string;
    baseCode: string = `
ControlStructure
CS {
    ControllerA {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> ControllerB
        }
    }
    ControllerB {
        hierarchyLevel 1
        controlActions {
            [ca "control action"] -> ControlledProcess
        }
        feedback {
            [fb "feedback"] -> ControllerA
        }
    }
    ControlledProcess {
        hierarchyLevel 2
        feedback {
            [fb "feedback"] -> ControllerB
        }
    }
}
`;

    constructor(documents: LangiumDocuments, shortId: string) {
        this.documents = documents;
        this.shortId = shortId;
    }

    protected generateCode(): string {
        return `
ControlStructure
CS {
    ControllerA` + this.shortId + this.counter +` {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> ControllerB` + this.shortId + this.counter +`
        }
    }
    ControllerB` + this.shortId + this.counter +` {
        hierarchyLevel 1
        controlActions {
            [ca "control action"] -> ControlledProcess` + this.shortId + this.counter +`
        }
        feedback {
            [fb "feedback"] -> ControllerA` + this.shortId + this.counter +`
        }
    }
    ControlledProcess` + this.shortId + this.counter +` {
        hierarchyLevel 2
        feedback {
            [fb "feedback"] -> ControllerB` + this.shortId + this.counter +`
        }
    }
}
`;
    }
    
    getPosition (uri: string): Position {
        this.insertText = this.generateCode();
        this.counter++;
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        return getPositionForCSTemplate(document, this);
    }
};

/**
 * Template for a control structure with two parallel controllers and one controlled process.
 */
 export class ParallelContsTemplate implements LanguageTemplate {
    insertText: string;
    documents: LangiumDocuments;
    id: string = 'parallelContsTemplate';
    protected counter: number = 0;
    protected shortId: string;
    baseCode: string = `
ControlStructure
CS {
    ControllerA {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> ControlledProcess
        }
    }
    ControllerB {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> ControlledProcess
        }
    }
    ControlledProcess {
        hierarchyLevel 1
        feedback {
            [fbA "feedback"] -> ControllerA
            [fbB "feedback"] -> ControllerB
        }
    }
}
`;

    constructor(documents: LangiumDocuments, shortId: string) {
        this.documents = documents;
        this.shortId = shortId;
    }

    protected generateCode(): string {
        return `
ControlStructure
CS {
    ControllerA` + this.shortId + this.counter +` {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> ControlledProcess` + this.shortId + this.counter +`
        }
    }
    ControllerB` + this.shortId + this.counter +` {
        hierarchyLevel 0
        controlActions {
            [ca "control action"] -> ControlledProcess` + this.shortId + this.counter +`
        }
    }
    ControlledProcess` + this.shortId + this.counter +` {
        hierarchyLevel 1
        feedback {
            [fbA "feedback"] -> ControllerA` + this.shortId + this.counter +`
            [fbB "feedback"] -> ControllerB` + this.shortId + this.counter +`
        }
    }
}
`;
    }
    
    getPosition (uri: string): Position {
        this.insertText = this.generateCode();
        this.counter++;
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        return getPositionForCSTemplate(document, this);
    }
};

/**
 * Template for a control structure with two consecutive controllers, one controlled process.
 */
 export class ConsContsWithLoopTemplate implements LanguageTemplate {
    insertText: string;
    documents: LangiumDocuments;
    id: string = 'consContsWithLoopTemplate';
    protected counter: number = 0;
    protected shortId: string;
    baseCode: string = `
ControlStructure
CS {
    ControllerA {
        hierarchyLevel 0
        controlActions {
            [caC "control action"] -> ControlledProcess
            [caB "control action"] -> ControllerB
        }
    }
    ControllerB {
        hierarchyLevel 1
        controlActions {
            [ca "control action"] -> ControlledProcess
        }
        feedback {
            [fb "feedback"] -> ControllerA
        }
    }
    ControlledProcess {
        hierarchyLevel 2
        feedback {
            [fbA "feedback"] -> ControllerA
            [fbB "feedback"] -> ControllerB
        }
    }
}
`;

    constructor(documents: LangiumDocuments, shortId: string) {
        this.documents = documents;
        this.shortId = shortId;
    }

    protected generateCode(): string {
        return `
ControlStructure
CS {
    ControllerA` + this.shortId + this.counter +` {
        hierarchyLevel 0
        controlActions {
            [caC "control action"] -> ControlledProcess` + this.shortId + this.counter +`
            [caB "control action"] -> ControllerB` + this.shortId + this.counter +`
        }
    }
    ControllerB` + this.shortId + this.counter +` {
        hierarchyLevel 1
        controlActions {
            [ca "control action"] -> ControlledProcess` + this.shortId + this.counter +`
        }
        feedback {
            [fb "feedback"] -> ControllerA` + this.shortId + this.counter +`
        }
    }
    ControlledProcess` + this.shortId + this.counter +` {
        hierarchyLevel 2
        feedback {
            [fbA "feedback"] -> ControllerA` + this.shortId + this.counter +`
            [fbB "feedback"] -> ControllerB` + this.shortId + this.counter +`
        }
    }
}
`;
    }
    
    getPosition (uri: string): Position {
        this.insertText = this.generateCode();
        this.counter++;
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        return getPositionForCSTemplate(document, this);
    }
};