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

import { injectable } from "inversify";
import { VNode } from "snabbdom";

/**
 * A sidebar panel provides content that is shown by the sidebar.
 * An implementation has to be registered as a "SidebarPanel" DISymbol.
 */
export interface ISidebarPanel {
    /** Unique ID that identifies this panel in the DI container. */
    readonly id: string;
    /** Title that should be used if this panel is shown. */
    readonly title: string;
    /**
     * Icon used for the corresponding panel toggle.
     * For an icon source you should use feather-icons (https://feathericons.com)
     * and the FeatherIcon method from the folder feather-icons-snabbdom.
     *
     * Usage example: `<FeatherIcon iconId={"settings"}/>` where
     * settings is the name of the icon.
     */
    readonly icon: VNode;

    /**
     * A sidebar panel can provide a position for its trigger in the trigger stack.
     * The trigger at the top has the smallest position. If two panels specify the
     * same position, the panel that is resolved first by the DI container is placed on top.
     */
    readonly position: number;

    /** Registers a callback that is called when this panel should be re-rendered. */
    onUpdate(callback: () => void): void;

    /**
     * Renders this panel content and returns the content as a snabbdom VNode.
     * Learn more about snabbdom and how to use it here:
     * - https://www.npmjs.com/package/snabbdom
     * - https://www.npmjs.com/package/snabbdom-jsx (package not used anymore, but concept is still
     * the same)
     */
    render(): VNode;
}

/**
 * Abstract SidebarPanel that should be used as the base for a custom {@link ISidebarPanel}.
 *
 * This class simplifies the implementation around handling render updates.
 */
@injectable()
export abstract class SidebarPanel implements ISidebarPanel {
    private _updateCallbacks: (() => void)[] = [];

    abstract get id(): string;
    abstract get title(): string;
    abstract get icon(): VNode;

    readonly position: number = 0;

    onUpdate(callback: () => void): void {
        this._updateCallbacks.push(callback);
    }

    /** Call this method if you want to trigger a re-render and update the UI. */
    update(): void {
        for (const callback of this._updateCallbacks) {
            callback();
        }
    }

    abstract render(): VNode;
}