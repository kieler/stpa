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
import { configureActionHandler, TYPES } from "sprotty";
import { DISymbol } from "../di.symbols";
import { ResetRenderOptionsAction, SendConfigAction, SendCutSetAction, SetRenderOptionAction } from "./actions";
import { CutSetPanel } from "./cut-set-panel";
import { CutSetsRegistry } from "./cut-set-registry";
import { GeneralPanel } from "./general-panel";
import { OptionsPanel } from "./options-panel";
import { OptionsRegistry } from "./options-registry";
import { OptionsRenderer } from "./options-renderer";
import { RenderOptionsRegistry } from "./render-options-registry";

/** Module that configures option related panels and registries. */
export const optionsModule = new ContainerModule((bind, _, isBound) => {
    bind(GeneralPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(GeneralPanel);

    bind(OptionsPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(OptionsPanel);

    bind(CutSetPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(CutSetPanel);

    bind(DISymbol.OptionsRenderer).to(OptionsRenderer);
    bind(DISymbol.OptionsRegistry).to(OptionsRegistry).inSingletonScope();
    bind(TYPES.IActionHandlerInitializer).toService(DISymbol.OptionsRegistry);

    bind(DISymbol.RenderOptionsRegistry).to(RenderOptionsRegistry).inSingletonScope();
    bind(DISymbol.CutSetsRegistry).to(CutSetsRegistry).inSingletonScope();

    const ctx = { bind, isBound };
    configureActionHandler(ctx, SetRenderOptionAction.KIND, DISymbol.RenderOptionsRegistry);
    configureActionHandler(ctx, ResetRenderOptionsAction.KIND, DISymbol.RenderOptionsRegistry);
    configureActionHandler(ctx, SendConfigAction.KIND, DISymbol.RenderOptionsRegistry);
    configureActionHandler(ctx, SendCutSetAction.KIND, DISymbol.CutSetsRegistry);
});
