/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2022 by
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

import { ElkNode } from 'elkjs/lib/elk-api';
import { ElkLayoutEngine } from 'sprotty-elk/lib/elk-layout';
import { SGraph, SModelIndex } from 'sprotty-protocol';

export class StpaLayoutEngine extends ElkLayoutEngine {

    layout(graph: SGraph, index?: SModelIndex | undefined): SGraph | Promise<SGraph> {
        if (this.getBasicType(graph) !== 'graph') {
            return graph;
        }
        if (!index) {
            index = new SModelIndex();
            index.add(graph);
        }
        const elkGraph = this.transformToElk(graph, index) as ElkNode;
        const debugElkGraph = JSON.stringify(elkGraph);
        return this.elk.layout(elkGraph).then(result => {
            this.applyLayout(result, index!);
            return graph;
        });
    }

}