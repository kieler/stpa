/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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

import { inject, injectable } from "inversify";
import { Anchor, IContextMenuService, MenuItem } from "sprotty";
import { ActionNotification } from "sprotty-vscode-protocol";
import { VsCodeMessenger } from "sprotty-vscode-webview/lib/services";
import { HOST_EXTENSION } from "vscode-messenger-common";
import { Messenger } from "vscode-messenger-webview";

@injectable()
export class ContextMenuService implements IContextMenuService {
    @inject(VsCodeMessenger) protected messenger: Messenger;
    /* The id of the context menu. */
    protected contextMenuID = "contextMenu";

    show(items: MenuItem[], anchor: Anchor, onHide?: (() => void) | undefined): void {
        // create or get the context menu
        const menu = this.getOrCreateContextMenu(onHide);

        // add the items to the menu
        for (const item of items) {
            this.addItemToContextMenu(menu, item);
        }

        // position the context menu
        menu.style.left = anchor.x.toString() + "px";
        menu.style.top = anchor.y.toString() + "px";

        const window_height = menu.parentElement!.offsetHeight;
        const window_width = menu.parentElement!.offsetWidth;
        // if the context menu would be partially outside the view, we relocate it so it fits inside
        if (menu.offsetHeight + menu.offsetTop > window_height) {
            menu.style.top = (window_height - menu.offsetHeight).toString() + "px";
        }
        if (menu.offsetWidth + menu.offsetLeft > window_width) {
            menu.style.left = (window_width - menu.offsetWidth).toString() + "px";
        }
    }

    /**
     * Creates a context menu with the "contextMenuID" if it does not exist yet, and adds it to the DOM.
     * Otherwise it returns the existing one.
     * @returns the context menu with the "contextMenuID".
     */
    protected getOrCreateContextMenu(onHide?: () => void): HTMLElement {
        let menu = document.getElementById(this.contextMenuID);
        if (menu === null) {
            // creates the context menu
            menu = document.createElement("ul");
            menu.id = this.contextMenuID;
            menu.classList.add("context-menu");

            // if the context menu is left, we hide it
            menu.addEventListener("mouseleave", () => {
                if (onHide !== undefined) {
                    onHide();
                }
                if (menu !== null) {
                    menu.classList.add("hidden");
                }
            });

            // adds the context menu to the dom
            const sprotty = document.getElementsByClassName("sprotty");
            if (sprotty.length !== 0) {
                sprotty[0].appendChild(menu);
            } else {
                console.log("Context menu could not be added to the DOM.");
                return menu;
            }
        } else {
            // reset the menu
            menu.innerHTML = "";
            menu.classList.remove("hidden");
        }
        return menu;
    }

    /**
     * Creates a DOM element for the given {@code item} and adds it to the given {@code menu}.
     * @param menu The menu to which the item should be added.
     * @param item The item to be added to the menu.
     */
    protected addItemToContextMenu(menu: HTMLElement, item: MenuItem): void {
        // creates the dom element for the item
        const domItem = document.createElement("li");
        domItem.classList.add("context-menu-item");
        domItem.innerText = item.label;
        domItem.id = item.label;

        // highlights the item when the mouse is over it
        domItem.addEventListener("mouseenter", () => {
            domItem.classList.add("selected");
        });
        domItem.addEventListener("mouseleave", () => {
            domItem.classList.remove("selected");
        });

        // executes the action when the item is clicked
        domItem.addEventListener("click", () => {
            for (const action of item.actions ?? []) {
                this.messenger.sendNotification(ActionNotification, HOST_EXTENSION, { clientId: "", action: action });
            }
        });

        // append the item to the menu
        menu.appendChild(domItem);
    }
}
