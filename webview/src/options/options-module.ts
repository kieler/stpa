/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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
import { configureActionHandler } from "sprotty";
import { DISymbol } from "../di.symbols";
import { SetRenderOptionAction, ResetRenderOptionsAction } from "./actions";
import { OptionsRenderer } from "./options-renderer";
import { GeneralPanel } from "./general-panel";
import { RenderOptionsRegistry } from "./render-options-registry";

/** Module that configures option related panels and registries. */
export const optionsModule = new ContainerModule((bind, _, isBound) => {
    bind(GeneralPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(GeneralPanel);

    bind(DISymbol.OptionsRenderer).to(OptionsRenderer);

    bind(DISymbol.RenderOptionsRegistry).to(RenderOptionsRegistry).inSingletonScope();

    const ctx = { bind, isBound };
    configureActionHandler(ctx, SetRenderOptionAction.KIND, DISymbol.RenderOptionsRegistry);
    configureActionHandler(ctx, ResetRenderOptionsAction.KIND, DISymbol.RenderOptionsRegistry);
});
