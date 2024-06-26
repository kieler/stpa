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

import { AstNode, BuildOptions, DefaultDocumentBuilder, LangiumDocument } from "langium";
import { CancellationToken } from "vscode-languageserver";

/**
 * Custom document builder to make the buildDocuments method public.
 */
export class StpaDocumentBuilder extends DefaultDocumentBuilder {
    async buildDocuments(
        documents: LangiumDocument<AstNode>[],
        options: BuildOptions,
        cancelToken: CancellationToken
    ): Promise<void> {
        return super.buildDocuments(documents, options, cancelToken);
    }
}
