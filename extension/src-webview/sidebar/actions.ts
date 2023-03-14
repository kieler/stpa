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

import { SetUIExtensionVisibilityAction } from "sprotty";
import { Action } from "sprotty-protocol";
import { Sidebar } from "./sidebar";

/** Wrapper action around {@link SetUIExtensionVisibilityAction} which shows the sidebar. */
export type ShowSidebarAction = SetUIExtensionVisibilityAction;

export namespace ShowSidebarAction {
    export function create():  ShowSidebarAction {
        return SetUIExtensionVisibilityAction.create({
            extensionId: Sidebar.ID,
            visible: true,
        });
    }
}

/**
 * Action used to toggle a registered sidebar panel in the sidebar. This may open
 * the sidebar if it is currently closed or replace the current panel with the
 * panel that should be toggled. If the panel is already shown, it is hidden and
 * the sidebar is closed.
 */
export interface ToggleSidebarPanelAction extends Action {
    kind: typeof ToggleSidebarPanelAction.KIND
    id: string
    state?: "show" | "hide"
}

export namespace ToggleSidebarPanelAction {
    export const KIND = "toggleSidebarPanel";

    /**
     * Creates a new {@link ToggleSidebarPanelAction}.
     * @param id ID if the registered panel that should be shown.
     * @param state Explicitly sets the new state for the panel. If this parameter is
     * absent, the current state is toggled.
     */
    export function create(id: string, state?: "show" | "hide"): ToggleSidebarPanelAction {
        return {
            kind: KIND,
            id: id,
            state: state
        };
    }

    /** Type predicate to narrow an action to this action. */
    export function isThisAction(action: Action): action is ToggleSidebarPanelAction {
        return action.kind === ToggleSidebarPanelAction.KIND;
    }
}