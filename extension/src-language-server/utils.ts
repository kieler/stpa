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

import { LangiumDocument, LangiumSharedServices } from "langium";
import { LangiumSprottySharedServices } from "langium-sprotty";
import { URI } from 'vscode-uri';
import { Model } from './generated/ast';

/**
 * Determines the model for {@code uri}.
 * @param uri The URI for which the model is desired.
 * @param shared The shared service.
 * @returns the model for the given uri.
 */
export async function getModel(uri: string, shared: LangiumSprottySharedServices | LangiumSharedServices): Promise<Model> {
    const textDocuments = shared.workspace.LangiumDocuments;
    const currentDoc = textDocuments.getOrCreateDocument(URI.parse(uri)) as LangiumDocument<Model>;
    let currentModel = currentDoc.parseResult.value;
    if (currentModel.rules.length !== 0 && currentModel.rules[0]?.contexts[0]?.vars[0]?.ref === undefined) {
        // build document
        await shared.workspace.DocumentBuilder.update([URI.parse(uri)], []);
        // update the model
        currentModel = currentDoc.parseResult.value;
    }
    return currentModel;
}