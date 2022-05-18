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
import { SetRenderOptionAction, ResetRenderOptionsAction } from "./actions";
import { OptionsRenderer } from "./options-renderer";
import { GeneralPanel } from "./general-panel";
import { RenderOptionsRegistry } from "./render-options-registry";
import { OptionsRegistry } from "./options-registry";
import { OptionsPanel } from "./options-panel";
import { TemplatePanel } from "../template/template-panel";
import { TemplateRenderer } from "../template/template-renderer";
import { TemplateRegistry } from "../template/template-registry";
import { TemplateMouseListener } from "../template/mouselistener";

/** Module that configures option related panels and registries. */
export const optionsModule = new ContainerModule((bind, _, isBound) => {
    bind(GeneralPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(GeneralPanel);

    bind(OptionsPanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(OptionsPanel);

    bind(DISymbol.OptionsRenderer).to(OptionsRenderer).inSingletonScope();
    bind(DISymbol.OptionsRegistry).to(OptionsRegistry).inSingletonScope();
    bind(TYPES.IActionHandlerInitializer).toService(DISymbol.OptionsRegistry);    

    bind(DISymbol.RenderOptionsRegistry).to(RenderOptionsRegistry).inSingletonScope();

    // TODO: create module for templates
    bind(TemplatePanel).toSelf().inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(TemplatePanel);

    bind(DISymbol.TemplateRenderer).to(TemplateRenderer).inSingletonScope();

    bind(DISymbol.TemplateRegistry).to(TemplateRegistry).inSingletonScope();
    bind(TYPES.IActionHandlerInitializer).toService(DISymbol.TemplateRegistry);

    bind(TYPES.MouseListener).to(TemplateMouseListener);

    const ctx = { bind, isBound };
    configureActionHandler(ctx, SetRenderOptionAction.KIND, DISymbol.RenderOptionsRegistry);
    configureActionHandler(ctx, ResetRenderOptionsAction.KIND, DISymbol.RenderOptionsRegistry);
});
