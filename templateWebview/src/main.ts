/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import '../css/diagram.css';

import { VNode } from 'snabbdom';
import { Container } from 'inversify';
import { patch } from './svg';
import { click } from './mouseListener';
import { panel, templatesID } from './html';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Starter {

    protected templates: VNode[] = [];
    protected container?: Container;
    protected identifier: string;

    constructor() {
        this.sendReadyMessage();
        this.acceptDiagramIdentifier();
    }

    protected sendReadyMessage(): void {
        vscode.postMessage({ readyMessage: 'Template Webview ready' });
    }

    protected acceptDiagramIdentifier(): void {
        console.log('Waiting for diagram identifier...');
        const eventListener = (message: any) => {
            this.handleMessages(message);
        };
        window.addEventListener('message', eventListener);
    }

    protected initHtml(): void {
        const containerDiv = document.getElementById(this.identifier + '_container');
        if (containerDiv) {
            const panelContainer = document.createElement("div");
            containerDiv.appendChild(panelContainer);
            patch(panelContainer, panel);
        }
        document.addEventListener('click', event => {
            const action = click(event);
            if (action) {
                vscode.postMessage({action: action});
            }
        });
    }


    protected handleMessages(message: any) {
        if (message.data.identifier) {
            this.identifier = message.data.identifier;
            this.initHtml();
        } else if (message.data.templates) {
            this.templates = message.data.templates;
            const containerDiv = document.getElementById(templatesID);
            if (containerDiv) {
                for (const temp of this.templates) {
                    const svgPlaceholder = document.createElement("div");
                    containerDiv.appendChild(svgPlaceholder);
                    patch(svgPlaceholder, temp);
                }
            }
        } else {
            console.log("Message not supported: " + message);
        }
    }

}

new Starter();
