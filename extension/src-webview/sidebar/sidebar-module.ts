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
import { ToggleSidebarPanelAction } from "./actions";
import { Sidebar } from "./sidebar";
import { SidebarPanelRegistry } from "./sidebar-panel-registry";

/** DI module that adds support for sidebars. */
export const sidebarModule = new ContainerModule((bind, _, isBound) => {
    bind(DISymbol.Sidebar).to(Sidebar).inSingletonScope();
    bind(TYPES.IUIExtension).toService(DISymbol.Sidebar);

    bind(DISymbol.SidebarPanelRegistry).to(SidebarPanelRegistry).inSingletonScope();

    const ctx = { bind, isBound };
    configureActionHandler(ctx, ToggleSidebarPanelAction.KIND, DISymbol.SidebarPanelRegistry);
});