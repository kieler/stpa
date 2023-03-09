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

import { LangiumSprottySharedServices } from "langium-sprotty";
import { Connection, URI } from "vscode-languageserver";
import { StpaServices } from "../stpa-module";

let lastUri: URI;

/**
 * Adds handlers for notificaions regarding the context table.
 * @param connection 
 * @param stpaServices 
 */
export function addSTPANotificationHandler(connection: Connection, stpaServices: StpaServices, shared: LangiumSprottySharedServices) {
    connection.onNotification('contextTable/getData', uri => {
        lastUri = uri;
        const contextTable = stpaServices.contextTable.ContextTableProvider;
        connection.sendNotification('contextTable/data', contextTable.getData(uri));
    });
    connection.onNotification('contextTable/selected', text => {
        const contextTable = stpaServices.contextTable.ContextTableProvider;
        const range = contextTable.getRangeOfUCA(lastUri, text);
        if (range) {
            connection.sendNotification('editor/highlight', ({ startLine: range.start.line, startChar: range.start.character, endLine: range.end.line, endChar: range.end.character, uri: lastUri }));
        } else {
            console.log("The selected UCA could not be found in the editor.");
        }
    });
    connection.onNotification('editor/textChange', async ({ changes, uri }) => {
        await shared.workspace.DocumentBuilder.update([uri], []);
        const edits = await stpaServices.utility.IDEnforcer.enforceIDs(changes, uri);
        if (edits.length !== 0) {
            connection.sendNotification('editor/workspaceedit', ({ edits, uri }));
        }
    });
}