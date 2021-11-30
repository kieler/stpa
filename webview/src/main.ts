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

import { SprottyDiagramIdentifier, SprottyStarter } from 'sprotty-vscode-webview';
import { Container } from 'inversify';
import { createSTPADiagramContainer } from './di.config';
import { SGraphSchema, SNodeSchema, SEdgeSchema, LocalModelSource, TYPES } from 'sprotty';

export class STPASprottyStarter extends SprottyStarter {

    createContainer(diagramIdentifier: SprottyDiagramIdentifier) {
        const container = createSTPADiagramContainer(diagramIdentifier.clientId);
        const graph: SGraphSchema = {
            type: 'graph',
            id: 'root',
            children: [
                {
                    type: 'node',
                    id: 'node1',
                    size: {width: 50, height: 20},
                    position: {x: 5, y: 5}
                } as SNodeSchema,
                {
                    type: 'node',
                    id: 'node2',
                    size: {width: 50, height: 20},
                    position: {x: 70, y: 5}
                } as SNodeSchema,
                {
                    type: 'edge',
                    id: 'edge1',
                    sourceId: 'node1',
                    targetId: 'node2'
                } as SEdgeSchema
            ]
        }
    
        const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
        modelSource.setModel(graph); 
        return container
    }

    addVscodeBindings(container: Container, diagramIdentifier: SprottyDiagramIdentifier): void {
        super.addVscodeBindings(container, diagramIdentifier)
        container.rebind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
    }
}

new STPASprottyStarter();
