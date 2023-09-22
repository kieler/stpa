/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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
import { Connection } from "vscode-languageserver";
import { getFTAModel } from "../utils";
import { determineMinimalCutSet, generateCutSetsForFT } from "./analysis/fta-cutSet-calculator";
import { FtaServices } from "./fta-module";
import { cutSetsToString } from "./utils";

/**
 * Adds handlers for notifications regarding fta.
 * @param connection
 * @param ftaServices
 */
export function addFTANotificationHandler(
    connection: Connection,
    ftaServices: FtaServices,
    sharedServices: LangiumSprottySharedServices
): void {
    addCutSetsHandler(connection, sharedServices);
}

/**
 * Adds handlers for requests regarding the cut sets.
 * @param connection
 * @param ftaServices
 */
function addCutSetsHandler(connection: Connection, sharedServices: LangiumSprottySharedServices): void {
    connection.onRequest("generate/getCutSets", async (uri: string) => {
        const model = await getFTAModel(uri, sharedServices);
        const nodes = [model.topEvent, ...model.components, ...model.conditions, ...model.gates];
        const cutSets = generateCutSetsForFT(nodes);
        return cutSetsToString(cutSets);
    });

    connection.onRequest("generate/getMinimalCutSets", async (uri: string) => {
        const model = await getFTAModel(uri, sharedServices);
        const nodes = [model.topEvent, ...model.components, ...model.conditions, ...model.gates];
        const minimalCutSets = determineMinimalCutSet(nodes);
        return cutSetsToString(minimalCutSets, true);
    });
}
