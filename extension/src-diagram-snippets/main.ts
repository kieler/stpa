/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2024 by
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

import { VNode } from "snabbdom";
import { AddSnippetAction } from "./actions";
import "./css/diagram.css";
import { addSnippetsToPanel, buttonID, panel, patch, textFieldID } from "./html";
import { click } from "./mouseListener";

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Starter {
    constructor() {
        vscode.postMessage({ readyMessage: "Diagram Snippet Webview ready" });
        console.log("Waiting for diagram identifier...");
        // add listener for messages
        const eventListener = (message: any): void => {
            this.handleMessages(message);
        };
        window.addEventListener("message", eventListener);
    }

    /**
     * Initializes the webview with a header and a placeholder for the snippets.
     * @param identifier The identifier of the element that should contain the webview.
     */
    protected initHtml(identifier: string): void {
        // initialize the panel
        const containerDiv = document.getElementById(identifier + "_container");
        if (containerDiv) {
            const panelContainer = document.createElement("div");
            containerDiv.appendChild(panelContainer);
            patch(panelContainer, panel);
        }
        // event listener for button to add snippets
        const bnt = document.getElementById(buttonID);
        if (bnt) {
            bnt.addEventListener("click", () => this.addSnippet());
        }
        // event listener for clicking on snippets
        document.addEventListener("click", event => {
            const action = click(event);
            if (action) {
                vscode.postMessage({ action: action });
            }
        });
    }

    /**
     * Sends the text in the input field as an AddSnippetAction to the extension.
     */
    protected addSnippet(): void {
        const text = document.getElementById(textFieldID);
        if (text) {
            const value = (text as HTMLInputElement).value;
            const action = {
                kind: AddSnippetAction.KIND,
                text: value,
            };
            vscode.postMessage({ action: action });
        }
    }

    /**
     * Handles incoming messages from the extension.
     * @param message The received Message.
     */
    protected handleMessages(message: any): void {
        if (message.data.identifier) {
            this.initHtml(message.data.identifier);
        } else if (message.data.snippets) {
            this.handleAddSnippets(message.data.snippets);
        } else {
            console.log("Message not supported: " + message);
        }
    }

    /**
     * Adds the {@code snippets} to the panel.
     * @param snippets The snippets that should be shown.
     */
    protected handleAddSnippets(snippets: VNode[]): void {
        addSnippetsToPanel(snippets);
    }
}

new Starter();
