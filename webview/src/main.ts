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
import { SGraphSchema, SEdgeSchema, LocalModelSource, TYPES, SLabelSchema } from 'sprotty';
import { CS_EDGE_TYPE, EdgeDirection, STPAAspect, CSEdgeSchema, STPANodeSchema, STPA_NODE_TYPE, PARENT_TYPE, CS_NODE_TYPE, CSNodeSchema } from './STPA-model';

export class STPASprottyStarter extends SprottyStarter {

    createContainer(diagramIdentifier: SprottyDiagramIdentifier) {
        const container = createSTPADiagramContainer(diagramIdentifier.clientId);

        const test: SGraphSchema = {
            id: "root",
            type: 'graph',
            children: [
                <SGraphSchema> {
                    id: 'controlStructure',
                    type: PARENT_TYPE,
                    position: {x: 450, y: 5},
                    children: [
                        {
                            type: CS_NODE_TYPE,
                            id: 'node10',
                            size: {width: 100, height: 40},
                            position: {x: 5, y: 5},
                            children: [
                                <SLabelSchema> {
                                    id: 'label10',
                                    type: 'label',
                                    text: 'FlightCrew'
                                }
                            ]
                        } as CSNodeSchema,
                        {
                            type: CS_NODE_TYPE,
                            id: 'node20',
                            size: {width: 100, height: 40},
                            position: {x: 5, y: 90},
                            children: [
                                <SLabelSchema> {
                                    id: 'label20',
                                    type: 'label',
                                    text: 'BSCU'
                                }
                            ]
                        } as CSNodeSchema,
                        {
                            type: CS_EDGE_TYPE,
                            id: 'edge10',
                            sourceId: 'node20',
                            targetId: 'node10',
                            direction: EdgeDirection.Up,
                            children: [
                                <SLabelSchema> {
                                    id: 'label40',
                                    type: 'label',
                                    text: 'feedback'
                                }
                            ]
                        } as CSEdgeSchema,
                        {
                            type: CS_EDGE_TYPE,
                            id: 'edge20',
                            sourceId: 'node10',
                            targetId: 'node20',
                            direction: EdgeDirection.Down,
                            children: [
                                <SLabelSchema> {
                                    id: 'label50',
                                    type: 'label',
                                    text: 'controlAction'
                                }
                            ]
                        } as CSEdgeSchema,
                        <SLabelSchema> {
                            id: 'label30',
                            type: 'label',
                            text: 'control structure'
                        }
                    ]
                },
                <SGraphSchema> {
                    id: 'relationGraph',
                    type: PARENT_TYPE,
                    position: {x: 0, y: 0},
                    children: [
                        <SLabelSchema> {
                            id: 'label100',
                            type: 'label',
                            text: 'relatonships'
                        },
                {
                    type: STPA_NODE_TYPE,
                    id: 'node1',
                    size: {width: 100, height: 40},
                    position: {x: 155, y: 5},
                    aspect: STPAAspect.Loss,
                    description: "Loss of life",
                    children: [
                        <SLabelSchema> {
                            id: 'label1',
                            type: 'label',
                            text: 'L1'
                        }
                    ]
                } as STPANodeSchema,
                {
                    type: STPA_NODE_TYPE,
                    id: 'node2',
                    size: {width: 100, height: 40},
                    position: {x: 155, y: 90},
                    aspect: STPAAspect.Hazard,
                    description: "blubb",
                    children: [
                        <SLabelSchema> {
                            id: 'label2',
                            type: 'label',
                            text: 'H1'
                        }
                    ]
                } as STPANodeSchema,
                {
                    type: 'edge',
                    id: 'edge1',
                    sourceId: 'node2',
                    targetId: 'node1'
                } as SEdgeSchema,
                {
                    type: STPA_NODE_TYPE,
                    id: 'node3',
                    size: {width: 100, height: 40},
                    position: {x: 155, y: 175},
                    aspect: STPAAspect.SystemConstraint,
                    description: "blubb",
                    children: [
                        <SLabelSchema> {
                            id: 'label3',
                            type: 'label',
                            text: 'SC1'
                        }
                    ]
                } as STPANodeSchema,
                {
                    type: 'edge',
                    id: 'edge2',
                    sourceId: 'node3',
                    targetId: 'node2'
                } as SEdgeSchema,
                {
                    type: STPA_NODE_TYPE,
                    id: 'node4',
                    size: {width: 100, height: 40},
                    position: {x: 155, y: 260},
                    aspect: STPAAspect.Responsibility,
                    description: "blubb",
                    children: [
                        <SLabelSchema> {
                            id: 'label4',
                            type: 'label',
                            text: 'R1'
                        }
                    ]
                } as STPANodeSchema,
                {
                    type: 'edge',
                    id: 'edge3',
                    sourceId: 'node4',
                    targetId: 'node3'
                } as SEdgeSchema,
                {
                    type: STPA_NODE_TYPE,
                    id: 'node5',
                    size: {width: 100, height: 40},
                    position: {x: 5, y: 345},
                    aspect: STPAAspect.UCA,
                    description: "blubb",
                    children: [
                        <SLabelSchema> {
                            id: 'label5',
                            type: 'label',
                            text: 'UCA1'
                        }
                    ]
                } as STPANodeSchema,
                {
                    type: 'edge',
                    id: 'edge4',
                    sourceId: 'node5',
                    targetId: 'node2'
                } as SEdgeSchema,
                {
                    type: STPA_NODE_TYPE,
                    id: 'node6',
                    size: {width: 100, height: 40},
                    position: {x: 5, y: 430},
                    aspect: STPAAspect.ControllerConstraint,
                    description: "blubb",
                    children: [
                        <SLabelSchema> {
                            id: 'label6',
                            type: 'label',
                            text: 'C1'
                        }
                    ]
                } as STPANodeSchema,
                {
                    type: 'edge',
                    id: 'edge5',
                    sourceId: 'node6',
                    targetId: 'node5'
                } as SEdgeSchema,
                {
                    type: STPA_NODE_TYPE,
                    id: 'node7',
                    size: {width: 100, height: 40},
                    position: {x: 305, y: 515},
                    aspect: STPAAspect.Scenario,
                    description: "blubb",
                    children: [
                        <SLabelSchema> {
                            id: 'label7',
                            type: 'label',
                            text: 'S1',
                            position: {x: 45, y: 5}
                        }
                    ]
                } as STPANodeSchema,
                {
                    type: 'edge',
                    id: 'edge6',
                    sourceId: 'node7',
                    targetId: 'node2'
                } as SEdgeSchema,
                {
                    type: STPA_NODE_TYPE,
                    id: 'node8',
                    size: {width: 100, height: 40},
                    position: {x: 305, y: 600},
                    aspect: STPAAspect.SafetyRequirement,
                    description: "blubb",
                    children: [
                        <SLabelSchema> {
                            id: 'label8',
                            type: 'label',
                            text: 'SR1',
                            position: {x: 45, y: 5}
                        }
                    ]
                } as STPANodeSchema,
                {
                    type: 'edge',
                    id: 'edge7',
                    sourceId: 'node8',
                    targetId: 'node7'
                } as SEdgeSchema]}
            ]
        }
    
        const modelSource = container.get<LocalModelSource>(TYPES.ModelSource);
        modelSource.setModel(test); 
        return container
    }

    addVscodeBindings(container: Container, diagramIdentifier: SprottyDiagramIdentifier): void {
        super.addVscodeBindings(container, diagramIdentifier)
        container.rebind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope();
    }
}

new STPASprottyStarter();
