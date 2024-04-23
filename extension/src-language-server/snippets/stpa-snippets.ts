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

import { LangiumDocuments, LangiumServices } from "langium";
import { Position } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { LanguageSnippet } from "./snippet-model";

/**
 * Class that handles snippets for the STPA diagram.
 */
export class StpaDiagramSnippets {
    protected readonly langiumDocuments: LangiumDocuments;
    /** Counts how much custom snippets exist */
    protected customSnippetsNumber: number = 0;
    /** The currently existing snippets */
    protected snippets: LanguageSnippet[];

    constructor(services: LangiumServices) {
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.snippets = this.generateDefaultSnippets();
    }

    /**
     * Creates the default snippets.
     * @returns a list with the default snippets.
     */
    protected generateDefaultSnippets(): LanguageSnippet[] {
        return [
            new SimpleCSSnippet(this.langiumDocuments, "T0"),
            new SimpleCSWithAcsSnippet(this.langiumDocuments, "T1"),
            new ConsControllersSnippet(this.langiumDocuments, "T3"),
            new ParallelContsSnippet(this.langiumDocuments, "T4"),
            new ConsContsWithLoopSnippet(this.langiumDocuments, "T5"),
        ];
    }

    /**
     * Creates a snippet for the given {@code text}.
     * @param text The text that should be inserted when clicking on the snippet.
     * @returns a snippet for the given {@code text}.
     */
    createSnippet(text: string): LanguageSnippet {
        // TODO: currently only control structure
        this.customSnippetsNumber++;
        return new CustomCSSnippet(this.langiumDocuments, text, "CS" + this.customSnippetsNumber, text);
    }

    /**
     * Get the snippets that are available.
     * @returns all available snippets.
     */
    getSnippets(): LanguageSnippet[] {
        return this.snippets;
    }
}

/**
 * Calculates the actual text of snippets for the control structure and their position in the document.
 * @param document The document in which the snippet should be inserted.
 * @param snippet The snippet that should be inserted.
 * @returns the position where the snippet should be added to the {@code document}.
 */
function getPositionForCSSnippet(document: TextDocument, snippet: LanguageSnippet): Position {
    const docText = document.getText();

    // determine range of already existing definition of control structure
    const titleIndex = docText.indexOf("ControlStructure");
    const startIndex = titleIndex !== -1 ? titleIndex : 0;
    const nextTitleIndex = docText.indexOf("Responsibilities");
    const endIndex = nextTitleIndex !== -1 ? nextTitleIndex - 1 : docText.length - 1;
    if (titleIndex === -1) {
        return document.positionAt(endIndex);
    } else {
        // delete the control structure keyword
        snippet.insertText = snippet.insertText.substring(18, snippet.insertText.length);
        // check whether a graph ID already exist
        const csText = docText.substring(startIndex, endIndex + 1);
        const graphIndex = csText.indexOf("{");
        if (graphIndex === -1) {
            return document.positionAt(endIndex);
        } else {
            // delete the graph ID
            snippet.insertText = snippet.insertText.substring(
                snippet.insertText.indexOf("{") + 1,
                snippet.insertText.lastIndexOf("}")
            );
            const bracketIndex = csText.lastIndexOf("}");
            return document.positionAt(titleIndex + bracketIndex);
        }
    }
}
// TODO: maybe need adjustments since CS can be nested now
/**
 * Adds {@code id} to the control structure node names in {@code text}.
 * @param text The control structure text.
 * @param id The id to append.
 * @returns The modified text.
 */
function addNodeIDs(text: string, id: string): string {
    const splits = text.split(/[^a-zA-Z0-9\{\}]/);
    // collect node names
    const names: string[] = [];
    for (let i = 3; i < splits.length; i++) {
        if (splits[i] === "{" && !isKeyWord(splits[i - 1])) {
            names.push(splits[i - 1]);
        }
    }

    // append ID to node names
    for (const name of names) {
        const regex = new RegExp(name, "g");
        text = text.replace(regex, name + id);
    }
    return text;
}

/**
 * Checks whether the given {@code text} is a keyword.
 * @param text The text to check.
 * @returns whether the given {@code text} is a keyword.
 */
function isKeyWord(text: string): boolean {
    return (
        text === "hierarchyLevel" ||
        text === "label" ||
        text === "processModel" ||
        text === "controlActions" ||
        text === "feedback"
    );
}

/**
 * Snippet language definition for STPA.
 */
export class STPALanguageSnippet implements LanguageSnippet {
    /** The text that should be inserted when clicking on the snippet */
    insertText: string;
    documents: LangiumDocuments;
    /** The id of the snippet */
    id: string;
    /** Counts how many times the snippet was added already  */
    protected counter: number = 0;
    /** A shorter ID used when executing the snippet */
    protected shortId: string | undefined;
    /** The base code of the snippet. Always starts with the header of the corresponding aspect. */
    baseCode: string;

    constructor(documents: LangiumDocuments, id: string, shortId?: string) {
        this.documents = documents;
        this.id = id;
        this.shortId = shortId;
    }

    getPosition(uri: string): Position {
        this.insertText = addNodeIDs(
            this.baseCode,
            this.shortId ? this.shortId + this.counter : this.id + this.counter
        );
        this.counter++;
        const document = this.documents.getOrCreateDocument(URI.parse(uri)).textDocument;
        return getPositionForCSSnippet(document, this);
    }
}

/**
 * Custom stpa snippet for the control structure.
 */
export class CustomCSSnippet extends STPALanguageSnippet {
    constructor(documents: LangiumDocuments, insertText: string, id: string, baseCode: string) {
        super(documents, id);
        this.insertText = insertText.trim();
        this.baseCode = baseCode.trim();
        this.checkCaption();
    }

    /**
     * Check whether the control structrue caption and graph name exists. If not, adds it to the baseCode.
     */
    protected checkCaption(): void {
        const splits = this.baseCode.split(/[^a-zA-Z0-9\{\}]/);
        const words = splits.filter(child => child !== "");
        if (words[0] !== "ControlStructure") {
            if (isKeyWord(words[2]) || (words[2] === "}" && words.length > 3)) {
                this.baseCode = "ControlStructure\r\nCS {\r\n" + this.baseCode + "\r\n}";
            } else {
                this.baseCode = "ControlStructure\r\n" + this.baseCode;
            }
        }
    }
}

/**
 * Snippet for a control structure with one controller and one controlled process.
 */
export class SimpleCSSnippet extends STPALanguageSnippet {
    constructor(documents: LangiumDocuments, shortId?: string) {
        super(documents, "simpleCSSnippet", shortId);
        this.baseCode = `
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
        this.insertText = this.baseCode;
    }
}

/**
 * Snippet for a control structure with one controller, one controlled process, one actuator, and one sensor.
 */
export class SimpleCSWithAcsSnippet extends STPALanguageSnippet {
    constructor(documents: LangiumDocuments, shortId?: string) {
        super(documents, "simpleCSWithAcsSnippet", shortId);
        this.baseCode = `
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
        this.insertText = this.baseCode;
    }
}

/**
 * Snippet for a control structure with two consecutive controllers and one controlled process.
 */
export class ConsControllersSnippet extends STPALanguageSnippet {
    constructor(documents: LangiumDocuments, shortId?: string) {
        super(documents, "consControllerSnippet", shortId);
        this.baseCode = `
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
        this.insertText = this.baseCode;
    }
}

/**
 * Snippet for a control structure with two parallel controllers and one controlled process.
 */
export class ParallelContsSnippet extends STPALanguageSnippet {
    constructor(documents: LangiumDocuments, shortId?: string) {
        super(documents, "parallelContsSnippet", shortId);
        this.baseCode =
            `
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
        this.insertText = this.baseCode;
    }
}

/**
 * Snippet for a control structure with two consecutive controllers, one controlled process.
 */
export class ConsContsWithLoopSnippet extends STPALanguageSnippet {
    constructor(documents: LangiumDocuments, shortId?: string) {
        super(documents, "consContsWithLoopSnippet", shortId);
        this.baseCode =
            `
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
        this.insertText = this.baseCode;
    }
}
