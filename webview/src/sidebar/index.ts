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

// Barrel module to reexport specific modules located in this folder.
// Modules outside of "sidebar" should only import from this index file!
// Learn more: https://basarat.gitbook.io/typescript/main-1/barrel

export { ToggleSidebarPanelAction } from "./actions";
export { sidebarModule } from "./sidebar-module";
export { SidebarPanel, ISidebarPanel } from "./sidebar-panel";