/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2023 by
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

import { DocumentState } from 'langium';
import { LangiumSprottySharedServices } from "langium-sprotty";
import { TextDocumentContentChangeEvent } from 'vscode';
import { Connection, URI } from "vscode-languageserver";
import { generateLTLFormulae } from './modelChecking/model-checking';
import { StpaServices } from "./stpa-module";

let lastUri: URI;

/** Needed to enforce IDs on a document that has been changed. */
let textChange: boolean = false;
let textChanges: TextDocumentContentChangeEvent[] = [];
let changeUri: string;

/**
 * Adds handlers for notifications regarding stpa.
 * @param connection 
 * @param stpaServices 
 */
export function addSTPANotificationHandler(connection: Connection, stpaServices: StpaServices, sharedServices: LangiumSprottySharedServices): void {
    addContextTableHandler(connection, stpaServices);
    addTextChangeHandler(connection, stpaServices, sharedServices);
    addModelCheckingHandler(connection, sharedServices);
}

/**
 * Adds handlers for notifications regarding the context table.
 * @param connection 
 * @param stpaServices 
 */
function addContextTableHandler(connection: Connection, stpaServices: StpaServices): void {
    // the data needed to create the context table is requested
    connection.onNotification('contextTable/getData', uri => {
        // data is computed and send back to the extension
        lastUri = uri;
        const contextTable = stpaServices.contextTable.ContextTableProvider;
        connection.sendNotification('contextTable/data', contextTable.getData(uri));
    });
    // a cell in the context table is selected
    connection.onNotification('contextTable/selected', text => {
        // compute the range of the textual definition of the selected UCA
        const contextTable = stpaServices.contextTable.ContextTableProvider;
        const range = contextTable.getRangeOfUCA(lastUri, text);
        if (range) {
            // highlight the textual definition in the editor
            connection.sendNotification('editor/highlight', ({ startLine: range.start.line, startChar: range.start.character, endLine: range.end.line, endChar: range.end.character, uri: lastUri }));
        } else {
            console.log("The selected UCA could not be found in the editor.");
        }
    });
}

/**
 * Adds handlers for notifications regarding changes in the editor.
 * @param connection 
 * @param stpaServices 
 * @param sharedServices 
 */
function addTextChangeHandler(connection: Connection, stpaServices: StpaServices, sharedServices: LangiumSprottySharedServices): void {
    // text in the editor changed
    connection.onNotification('editor/textChange', async ({ changes, uri }) => {
        // save the changes and the uri of the file. Before we can do something we have to wait until the document is built (see below).
        textChange = true;
        textChanges = changes;
        changeUri = uri;
    });
    sharedServices.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, async () => {
        // document built is finished
        if (textChange) {
            // built was triggered because of changes in the editor
            // enforce correct IDs for the STPA components by sending the computed edits to the extension
            const edits = await stpaServices.utility.IDEnforcer.enforceIDs(textChanges, changeUri);
            if (edits.length !== 0) {
                connection.sendNotification('editor/workspaceedit', ({ edits, uri: changeUri }));
            }
            // reset saved changes
            textChange = false;
            textChanges = [];
        }
    });
}

function addModelCheckingHandler(connection: Connection, sharedServices: LangiumSprottySharedServices): void {
    // model checking
    connection.onRequest('modelChecking/generateLTL', async (uri: string) => {
        // generate and send back the LTL formula based on the STPA UCAs
        const formulas = await generateLTLFormulae(uri, sharedServices);
        return formulas;
    });
}
