/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2022 by
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

import { startLanguageServer } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { addDiagramHandler } from 'langium-sprotty';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { addContextTableHandler } from './contextTable/message-handler';
import { addNotificationHandler } from './handler';
import { createStpaServices } from './stpa-module';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the language services
const { shared, states } = createStpaServices({ connection, ...NodeFileSystem });

// Start the language server with the language-specific services
startLanguageServer(shared);
addDiagramHandler(connection, shared);

addContextTableHandler(connection, states);
addNotificationHandler(connection, shared);

// handle configuration changes for the validation checks
connection.onNotification('configuration', options => {
    for (const option of options) {
        switch(option.id) {
            case "checkResponsibilitiesForConstraints":
                states.validation.StpaValidator.checkResponsibilitiesForConstraints = option.value
                break;
            case "checkConstraintsForUCAs":
                states.validation.StpaValidator.checkConstraintsForUCAs = option.value
                break;
            case "checkScenariosForUCAs":
                states.validation.StpaValidator.checkScenariosForUCAs = option.value
                break;
            case "checkSafetyRequirementsForUCAs":
                states.validation.StpaValidator.checkSafetyRequirementsForUCAs = option.value
                break;
        }
    }
});