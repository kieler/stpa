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

import 'reflect-metadata';
import 'sprotty-vscode-webview/css/sprotty-vscode.css';

import { Container } from 'inversify';
import { SprottyDiagramIdentifier, VscodeDiagramServer } from 'sprotty-vscode-webview';
import { SprottyLspEditStarter } from 'sprotty-vscode-webview/lib/lsp/editing';
import { createSTPADiagramContainer } from './di.config';
import { StpaDiagramServer } from './diagram-server';

export class StpaSprottyStarter extends SprottyLspEditStarter {

    createContainer(diagramIdentifier: SprottyDiagramIdentifier): Container {
        return createSTPADiagramContainer(diagramIdentifier.clientId);
    }

    protected addVscodeBindings(container: Container, diagramIdentifier: SprottyDiagramIdentifier): void {
        super.addVscodeBindings(container, diagramIdentifier);
        container.rebind(VscodeDiagramServer).to(StpaDiagramServer);
    }
}

new StpaSprottyStarter().start();

