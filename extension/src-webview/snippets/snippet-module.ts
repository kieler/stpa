/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2024 by
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

import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { DISymbol } from "../di.symbols";
import { SnippetRegistry } from "../snippets/snippet-registry";
import { SnippetRenderer } from "../snippets/snippet-renderer";

/** Module that configures option related panels and registries. */
export const snippetModule = new ContainerModule((bind, _, isBound) => {
    bind(DISymbol.SnippetRenderer).to(SnippetRenderer).inSingletonScope();

    bind(DISymbol.SnippetRegistry).to(SnippetRegistry).inSingletonScope();
    bind(TYPES.IActionHandlerInitializer).toService(DISymbol.SnippetRegistry);
});
