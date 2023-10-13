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

import { AstNode, LangiumSharedServices } from "langium";
import { LangiumSprottySharedServices } from "langium-sprotty";
import { URI } from "vscode-uri";

/**
 * Determines the model for {@code uri}.
 * @param uri The URI for which the model is desired.
 * @param shared The shared services.
 * @returns the model for the given uri.
 */
export async function getModel(
    uri: string,
    shared: LangiumSprottySharedServices | LangiumSharedServices
): Promise<AstNode> {
    const textDocuments = shared.workspace.LangiumDocuments;
    const currentDoc = textDocuments.getOrCreateDocument(URI.parse(uri));
    return currentDoc.parseResult.value;
}
