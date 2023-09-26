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
import { determineMinimalCutSets, determineCutSetsForFT } from "./analysis/fta-cutSet-calculator";
import { FtaServices } from "./fta-module";
import { cutSetsToString } from "./utils";

/**
 * Adds handlers for notifications regarding fta.
 * @param connection
 * @param ftaServices
 * @param sharedServices
 */
export function addFTANotificationHandler(
    connection: Connection,
    ftaServices: FtaServices,
    sharedServices: LangiumSprottySharedServices
): void {
    addCutSetsHandler(connection, ftaServices, sharedServices);
}

/**
 * Adds handlers for requests regarding the cut sets.
 * @param connection
 * @param ftaServices
 * @param sharedServices
 */
function addCutSetsHandler(
    connection: Connection,
    ftaServices: FtaServices,
    sharedServices: LangiumSprottySharedServices
): void {
    connection.onRequest("generate/getCutSets", async (uri: string) => {
        return cutSetsRequested(uri, ftaServices, sharedServices, false);
    });
    connection.onRequest("generate/getMinimalCutSets", async (uri: string) => {
        return cutSetsRequested(uri, ftaServices, sharedServices, true);
    });
}

/**
 * Determines the (minimal) cut sets and return them as a list of strings.
 * @param uri The uri of the model for which the cut sets should be determined.
 * @param ftaServices
 * @param sharedServices
 * @param minimal Determines whether all cut sets or only the minimal cut sets should be determined.
 * @returns the (minimal) cut sets of the model given by {@code uri} as list of strings.
 */
async function cutSetsRequested(
    uri: string,
    ftaServices: FtaServices,
    sharedServices: LangiumSprottySharedServices,
    minimal: boolean
): Promise<string[]> {
    const model = await getFTAModel(uri, sharedServices);
    const nodes = [model.topEvent, ...model.components, ...model.conditions, ...model.gates];
    const cutSets = minimal ? determineMinimalCutSets(nodes) : determineCutSetsForFT(nodes);
    const cutSetsString = cutSetsToString(cutSets);
    const dropdownValues = cutSetsString.map((cutSet) => {
        return { displayName: cutSet, id: cutSet };
    });
    ftaServices.options.SynthesisOptions.updateCutSetsOption(dropdownValues);
    return cutSetsString;
}
