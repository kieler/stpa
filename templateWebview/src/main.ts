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
import { Container } from 'inversify';
import { patch, testNode2 } from './svg';
import { click } from './mouseListener';
import { panel, templatesID } from './html';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Starter {


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
        vscode.postMessage("test");
        const containerDiv = document.getElementById(this.identifier + '_container');
        if (containerDiv) {
            const panelContainer = document.createElement("div");
            containerDiv.appendChild(panelContainer);
            patch(panelContainer, panel);
        }
        document.addEventListener('click', event => {
            click(event);
        });
    }

    protected handleMessages(message: any) {
        if (message.data.identifier) {
            this.identifier = message.data.identifier;
            this.initHtml();
            //} else if (message.templates) {
            const containerDiv = document.getElementById(templatesID);
            if (containerDiv) {
                for (let i = 0; i < 2; i++) {
                    const svgPlaceholder = document.createElement("div");
                    containerDiv.appendChild(svgPlaceholder);
                    patch(svgPlaceholder, testNode2);
                }
            }
        }
    }

}

new Starter();
