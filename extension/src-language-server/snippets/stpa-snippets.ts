/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2024 by
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
import * as defaultSnippets from "./default-stpa-snippets.json";

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
        const list: LanguageSnippet[] = [];
        defaultSnippets.snippets.forEach((snippet: {name: string, code: string}) => {
            list.push(new CustomCSSnippet(this.langiumDocuments, snippet.code, snippet.name));
        });
        return list;
    }

    /**
     * Creates a snippet for the given {@code text}.
     * @param text The text that should be inserted when clicking on the snippet.
     * @returns a snippet for the given {@code text}.
     */
    createSnippet(text: string): LanguageSnippet {
        // TODO: currently only control structure
        this.customSnippetsNumber++;
        return new CustomCSSnippet(this.langiumDocuments, text, "CS" + this.customSnippetsNumber);
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
 * Adds {@code id} to the control structure node names in {@code text} to avoid name clashes.
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

    constructor(documents: LangiumDocuments, code: string, id: string) {
        this.documents = documents;
        this.id = id;
        this.insertText = code.trim();
        this.baseCode = code.trim();
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
    constructor(documents: LangiumDocuments, code: string, id: string) {
        super(documents, code, id);
        this.checkCaption();
    }

    /**
     * Check whether the control structure caption and graph name exist. If not, add them to the baseCode.
     */
    protected checkCaption(): void {
        const regex = /[\{\}a-zA-Z0-9_]*/g;
        const splits = this.baseCode.match(regex);
        // "{" and "}" get separated from the other words
        const words = splits?.map(s => s.split(/([\{\}])/g)).flat().filter(child => child !== "");
        if (words && words.length >= 1 && words[0] !== "ControlStructure") {
            if (words.length >= 3 && (isKeyWord(words[2]) || words[2] === "}")) {
                this.baseCode = "ControlStructure\r\nCS {\r\n" + this.baseCode + "\r\n}";
            } else {
                this.baseCode = "ControlStructure\r\n" + this.baseCode;
            }
        }
    }
}
