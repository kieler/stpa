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

import { injectable } from "inversify";
import { Anchor, IContextMenuService, MenuItem } from "sprotty";

@injectable()
export class ContextMenuService implements IContextMenuService {
    protected contextmenuID = "contextMenu"; //ID used to find the contextmenu

    protected onHide: any; // if the contextmenu should be hidden and there was a hide method provided

    show(items: MenuItem[], anchor: Anchor, onHide?: (() => void) | undefined): void {
        //If no menu exists we want to create one
        let menu = document.getElementById(this.contextmenuID);
        if (menu === null) {
            // creates the context menu and styles it
            menu = document.createElement("ul");
            menu.id = this.contextmenuID;
            this.setupMenuEntrys(menu);
            menu.style.marginTop = "-1px";
            menu.style.marginLeft = "-1px";
            menu.style.backgroundColor = "#f4f5f6";
            menu.style.border = "2px solid #bfc2c3";

            // if the context menu is leaved, we hide it
            menu.addEventListener("mouseleave", () => {
                if (menu !== null) {
                    menu.style.display = "none";
                }
                if (this.onHide !== undefined) { this.onHide();}
            });

            // adds the context menu to the dom
            const sprotty = document.getElementsByClassName("sprotty");
            if (sprotty.length !== 0) {
                sprotty[0].appendChild(menu);
            } else {
                return;
            }
        }
        //if a contextmenu was opened before there may be items in it therefor we reset it here
        menu.innerHTML = "";
        menu.style.backgroundColor = "#f4f5f6";

        //for every structured change we can do we want to display it to the user
        for (const item of items) {
            //Create an item to add to the menu via dom manipulation
            const new_item = document.createElement("li");
            this.setupItemEntrys(new_item);
            new_item.innerText = item.label; //label is shown to the user
            new_item.id = item.label;

            // simple mouselisteners so the color changes to indicate what is selected
            new_item.addEventListener("mouseenter", (ev) => {
                new_item.style.backgroundColor = "#bae5dd";
                new_item.style.border = "1px solid #40c2a8";
                new_item.style.borderRadius = "5px";
            });
            new_item.addEventListener("mouseleave", (ev) => {
                new_item.style.backgroundColor = "#f4f5f6";
                new_item.style.border = "";
                new_item.style.borderRadius = "";
            });
            //actually appends the items to the context menu
            menu.appendChild(new_item);
        }

        //Displays the contextmenu
        menu.style.display = "block";
        this.onHide = onHide;

        //Positioning of the context menu
        menu.style.left = anchor.x.toString() + "px";
        menu.style.top = anchor.y.toString() + "px";

        const window_height = menu.parentElement!.offsetHeight;
        const window_width = menu.parentElement!.offsetWidth;
        //if the contextmenu would be partially outside the view we need to relocate it so it fits inside
        if (menu.offsetHeight + menu.offsetTop > window_height)
            menu.style.top = (window_height - menu.offsetHeight).toString() + "px";

        if (menu.offsetWidth + menu.offsetLeft > window_width)
            menu.style.left = (window_width - menu.offsetWidth).toString() + "px";
    }

    setupItemEntrys(item: HTMLElement): void {
        item.style.display = "block";
        item.style.backgroundColor = "#f4f5f6";
        item.style.position = "relative";
        item.style.padding = "5px";
    }

    setupMenuEntrys(menu: HTMLElement): void {
        menu.style.float = "right";
        menu.style.position = "absolute";
        menu.style.listStyle = "none";
        menu.style.padding = "0";
        menu.style.display = "none";
        menu.style.color = "#3e4144";
    }
}
