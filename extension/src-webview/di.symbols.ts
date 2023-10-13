/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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

/** DI Symbols for Services provided by the PASTA DI container. */
export const DISymbol = {
    Sidebar: Symbol("Sidebar"),
    SidebarPanel: Symbol("SidebarPanel"),
    SidebarPanelRegistry: Symbol("SidebarPanelRegistry"),

    OptionsRenderer: Symbol("OptionsRenderer"),
    OptionsRegistry: Symbol("OptionsRegistry"),
    RenderOptionsRegistry: Symbol("RenderOptionsRegistry"),
};
