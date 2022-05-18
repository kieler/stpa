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

import { /* ModelLayoutOptions, */ SGraph, SLabel, SModelElement } from 'sprotty-protocol'
import { CSEdge, CSNode } from '../STPA-interfaces';
import { CS_EDGE_TYPE, CS_NODE_TYPE, EdgeDirection } from '../stpa-model';

export interface Template {
    graph: Readonly<SModelElement>;
    code: string;
}

const testGraph1: Readonly<SModelElement> = {
    type: 'graph',
    id: 'tempGraph',
/*     layoutOptions: {
        'org.eclipse.elk.separateConnectedComponents': 'false',
        'org.eclipse.elk.layered.crossingMinimization.semiInteractive': 'true',
        'cycleBreaking.strategy': 'INTERACTIVE',
        'layering.strategy': 'INTERACTIVE'
    } as ModelLayoutOptions, */
    children: [
        {
            type: CS_NODE_TYPE,
            id: 'tempnode1',
            size: {width: 10, height: 10},
            //position: {x: 0, y: 0},
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
            //position: {x: 0, y: 100},
            children: [
                {
                    type:'label',
                    id: 'tempLabel2',
                    text: 'Controlled Process'
                } as SLabel
            ]
        } as CSNode,
        {
            type: CS_EDGE_TYPE,
            id: 'tempedge1',
            sourceId: 'tempnode1',
            targetId: 'tempnode2',
            direction: EdgeDirection.DOWN,
            children: [
                {
                    type:'label:xref',
                    id: 'tempLabel3',
                    text: 'control action'
                } as SLabel
            ]
        } as CSEdge,
        {
            type: CS_EDGE_TYPE,
            id: 'tempedge2',
            sourceId: 'tempnode2',
            targetId: 'tempnode1',
            direction: EdgeDirection.UP,
            children: [
                {
                    type:'label:xref',
                    id: 'tempLabel4',
                    text: 'feedback'
                } as SLabel
            ]
        } as CSEdge
    ] as SModelElement[],
    zoom: 0.8,
    scroll: {x:0, y:0},
} as SGraph

export const TestTemplate1: Template = {
    graph: testGraph1,
    code: 'testString1'
}

const testGraph2: Readonly<SModelElement> = {
    type: 'graph',
    id: 'tempGraph2',
    children: [
        {
            type: CS_NODE_TYPE,
            id: 'tempnode21',
            size: {width: 10, height: 10},
            children: [
                {
                    type:'label',
                    id: 'tempLabel21',
                    text: 'Controller'
                } as SLabel
            ]
        } as CSNode
    ] as SModelElement[],
    zoom: 0.8,
    scroll: {x:0, y:0},
} as SGraph

export const TestTemplate2: Template = {
    graph: testGraph2,
    code: 'testString2'
}