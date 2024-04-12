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

import { injectable, multiInject, optional } from "inversify";
import { ICommand } from "sprotty";
import { Action } from "sprotty-protocol";
import { Registry } from "../base/registry";
import { DISymbol } from "../di.symbols";
import { ToggleSidebarPanelAction } from "./actions";
import { ISidebarPanel } from "./sidebar-panel";

/**
 * {@link Registry} that stores all sidebar panels which are resolved by the DI container.
 * At most one panel is considered active. The state (which panel is active) can
 * be changed with a {@link ToggleSidebarPanelAction}.
 */
@injectable()
export class SidebarPanelRegistry extends Registry {
    private _panels: Map<string, ISidebarPanel>;
    private _currentPanelID: string | null;

    constructor(@multiInject(DISymbol.SidebarPanel) @optional() panels: ISidebarPanel[] = []) {
        super();
        this._panels = new Map();
        this._currentPanelID = null;

        for (const panel of panels) {
            this._panels.set(panel.id, panel);
        }
    }

    handle(action: Action): void | Action | ICommand {
        if (ToggleSidebarPanelAction.isThisAction(action)) {
            // Nothing to do if the panel should be shown/hidden and is already active/inactive.
            if (this._currentPanelID === action.id && action.state === "show") {return;}
            if (this._currentPanelID !== action.id && action.state === "hide") {return;}

            if (this._currentPanelID === action.id) {
                // Panel is active so it should either be hidden explicitly or toggled to be hidden
                this._currentPanelID = null;
                this.notifyListeners();
            } else if (this._panels.has(action.id)) {
                // Panel is inactive and the given id exists so it should either be shown explicitly or toggled to be shown
                this._currentPanelID = action.id;
                this.notifyListeners();
            }
        }
    }

    get allPanels(): ISidebarPanel[] {
        // Sort the panels before they are returned. There won't be any considerable
        // amount of panels that could cause performance concerns. If sorting becomes
        // an issue, it could be moved to the constructor to only be applied once. This
        // would only work as long as it is not possible to add panels dynamically.
        return Array.from(this._panels.values()).sort((p1, p2) => p1.position - p2.position);
    }

    get currentPanel(): ISidebarPanel | null {
        return this._currentPanelID === null
            ? null
            : this._panels.get(this._currentPanelID) ?? null;
    }

    get currentPanelID(): string | null {
        return this._currentPanelID;
    }
}