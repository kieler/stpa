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

import { LangiumDiagramGenerator } from "langium-sprotty";
import { SModelElement, SModelRoot } from "sprotty-protocol";
import { Position } from "vscode-languageserver";

/**
 * Represents a snippet that can be inserted into a document.
 */
export interface LanguageSnippet {
    /** the code that should be added when executing the snippet */
    baseCode: string;
    /** the text to insert, representing the snippet. 
     * This may differ from the baseCode since the control structure keyword and graph ID are not necessarily added.
     * Furthermore nodes need unique IDs each time the snippet is executed. */
    insertText: string;
    /** unique id of the snippet */
    id: string;

    /**
     * Calculates the position where the snippet should be inserted.
     * @param uri The uri of the document in which the snippet should be inserted.
     * @returns the position where the snippet should be inserted.
     */
    getPosition(uri: string): Position;
}

/**
 * Represents a snippet that can be displayed in a webview.
 */
export interface WebviewSnippet {
    /** the graph to display */
    graph: Readonly<SModelElement>;
    /** unique id of the snippet */
    id: string;
}

/**
 * A generator for snippet diagrams.
 */
export abstract class SnippetGraphGenerator extends LangiumDiagramGenerator {
    /**
     * Deletes all edges that are not connected to a node.
     * @param snippet The snippet to clean up.
     */
    abstract deleteDanglingEdges(snippet: LanguageSnippet): void;
    /**
     * Generates the root element of the snippet diagram.
     * @param snippet The snippet to generate the diagram for.
     */
    abstract generateSnippetRoot(snippet: LanguageSnippet): Promise<SModelRoot | undefined>;
}
