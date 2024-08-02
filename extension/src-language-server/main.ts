/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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

import { startLanguageServer } from "langium";
import { addDiagramHandler } from "langium-sprotty";
import { NodeFileSystem } from "langium/node";
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import { addFTANotificationHandler } from "./fta/fta-message-handler";
import { addNotificationHandler } from "./handler";
import { createServices } from "./module";
import { addSTPANotificationHandler } from "./stpa/message-handler";
import { updateValidationChecks } from "./utils";

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the language services
const { shared, stpa, fta } = createServices({ connection, ...NodeFileSystem });

// Start the language server with the language-specific services
startLanguageServer(shared);
addDiagramHandler(connection, shared);

addSTPANotificationHandler(connection, stpa, shared);
addFTANotificationHandler(connection, fta, shared);
addNotificationHandler(connection, shared);

// handle configuration/storage changes 
connection.onNotification("configuration", (options: Record<string, any>) => {
    updateValidationChecks(options["validation"], stpa.validation.StpaValidator);
    // TODO: update synthesis options
});

connection.onInitialized(() => connection.sendNotification("ready"));
