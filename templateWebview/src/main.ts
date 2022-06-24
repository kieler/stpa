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

import { Container } from 'inversify';

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
        this.initHtml();
    }

    protected sendReadyMessage(): void {
        vscode.postMessage({ readyMessage: 'Template Webview ready' });
    }

    protected acceptDiagramIdentifier(): void {
        console.log('Waiting for diagram identifier...');
        const eventListener = (message: any) => {
            //if (isDiagramIdentifier(message.data)) {
            this.identifier = message.data
            //}
        };
        window.addEventListener('message', eventListener);
    }

    protected initHtml(): void {
        vscode.postMessage("test")
        const containerDiv = document.getElementById(this.identifier + '_container');
        const haloo = document.createTextNode("Halloooo")
        if (containerDiv) {
            const svgContainer = document.createElement("div");
            svgContainer.id = "test";
            containerDiv.appendChild(svgContainer);
            containerDiv.appendChild(haloo);
        }
        document.addEventListener('click', event => {
            let node = event.target;
            console.log(node);
        })
    }
}


new Starter();

/* '<div> <h3>Test</h3></div>'
const containerDiv = document.getElementById(this.diagramIdentifier.clientId + '_container');
if (containerDiv) {
    const svgContainer = document.createElement("div");
    svgContainer.id = this.viewerOptions.baseDiv;
    containerDiv.appendChild(svgContainer);

    const hiddenContainer = document.createElement("div");
    hiddenContainer.id = this.viewerOptions.hiddenDiv;
    document.body.appendChild(hiddenContainer);

    const statusDiv = document.createElement("div");
    statusDiv.setAttribute('class', 'sprotty-status');
    containerDiv.appendChild(statusDiv);

    this.statusIconDiv = document.createElement("div");
    statusDiv.appendChild(this.statusIconDiv);

    this.statusMessageDiv = document.createElement("div");
    this.statusMessageDiv.setAttribute('class', 'sprotty-status-message');
    statusDiv.appendChild(this.statusMessageDiv);
} */