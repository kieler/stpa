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

import { SGraph, SLabel, SModelElement } from 'sprotty-protocol'
import { CSNode } from '../STPA-interfaces';
import { CS_NODE_TYPE } from '../stpa-model';

export interface Template {
    graph: Readonly<SModelElement>;
    code: string;
}

const testGraph: Readonly<SModelElement> = {
    type: 'graph',
    id: 'tempGraph',
    children: [
        {
            type: CS_NODE_TYPE,
            id: 'tempnode1',
            size: {width: 10, height: 10},
            children: [
                {
                    type:'label',
                    id: 'tempLabel1',
                    text: 'Controller'
                } as SLabel
            ]
        } as CSNode,
        {
            type: CS_NODE_TYPE,
            id: 'tempnode2',
            size: {width: 10, height: 10},
            children: [
                {
                    type:'label',
                    id: 'tempLabel2',
                    text: 'Controlled Process'
                } as SLabel
            ]
        } as CSNode
    ] as SModelElement[],
    zoom: 1,
    scroll: {x:0, y:0},
} as SGraph

export const TestTemplate: Template = {
    graph: testGraph,
    code: 'testString'
}