/********************************************************************************
 * Copyright (c) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import 'reflect-metadata';
import 'sprotty-vscode-webview/css/sprotty-vscode.css';

import { SprottyDiagramIdentifier } from 'sprotty-vscode-webview';
import { Container } from 'inversify';
import { createSTPADiagramContainer } from './di.config';
import { SprottyLspEditStarter } from 'sprotty-vscode-webview/lib/lsp/editing'
import { ColorfulCommand, FormToggleCommand, PrintStyleCommand, StandardColorCommand } from './commands';
import { configureCommand } from 'sprotty';

export class STPASprottyStarter extends SprottyLspEditStarter {

    createContainer(diagramIdentifier: SprottyDiagramIdentifier) {
        return createSTPADiagramContainer(diagramIdentifier.clientId);
    }

    addVscodeBindings(container: Container, diagramIdentifier: SprottyDiagramIdentifier): void {
        super.addVscodeBindings(container, diagramIdentifier)
        // commands must be configured
        configureCommand(container, ColorfulCommand);
        configureCommand(container, StandardColorCommand);
        configureCommand(container, PrintStyleCommand);
        configureCommand(container, FormToggleCommand);
    }
}

new STPASprottyStarter();
