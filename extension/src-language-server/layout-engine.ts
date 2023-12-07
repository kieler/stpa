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

import { ElkExtendedEdge, ElkNode, ElkPrimitiveEdge } from "elkjs/lib/elk-api";
import { ElkLayoutEngine } from "sprotty-elk/lib/elk-layout";
import { Point, SEdge, SGraph, SModelIndex } from "sprotty-protocol";
import { FTAEdge } from "../src-webview/fta/fta-model";
import { FTA_EDGE_TYPE } from "./fta/diagram/fta-model";

export class LayoutEngine extends ElkLayoutEngine {
    layout(graph: SGraph, index?: SModelIndex | undefined): SGraph | Promise<SGraph> {
        if (this.getBasicType(graph) !== "graph") {
            return graph;
        }
        if (!index) {
            index = new SModelIndex();
            index.add(graph);
        }
        const elkGraph = this.transformToElk(graph, index) as ElkNode;
        /* used to inspect the elk graph in elklive */
        // const debugElkGraph = JSON.stringify(elkGraph);
        // console.log(debugElkGraph);
        return this.elk.layout(elkGraph).then((result) => {
            this.applyLayout(result, index!);
            return graph;
        });
    }

    /** Override method to save the junctionpoints in FTAEdges*/
    protected applyEdge(sedge: SEdge, elkEdge: ElkExtendedEdge, index: SModelIndex): void {
        const points: Point[] = [];
        if (sedge.type === FTA_EDGE_TYPE) {
            (sedge as any as FTAEdge).junctionPoints = elkEdge.junctionPoints;
        }
        if (elkEdge.sections && elkEdge.sections.length > 0) {
            const section = elkEdge.sections[0];
            if (section.startPoint) points.push(section.startPoint);
            if (section.bendPoints) points.push(...section.bendPoints);
            if (section.endPoint) points.push(section.endPoint);
        } else if (isPrimitiveEdge(elkEdge)) {
            if (elkEdge.sourcePoint) points.push(elkEdge.sourcePoint);
            if (elkEdge.bendPoints) points.push(...elkEdge.bendPoints);
            if (elkEdge.targetPoint) points.push(elkEdge.targetPoint);
        }
        sedge.routingPoints = points;

        if (elkEdge.labels) {
            elkEdge.labels.forEach((elkLabel) => {
                const sLabel = elkLabel.id && index.getById(elkLabel.id);
                if (sLabel) {
                    this.applyShape(sLabel, elkLabel, index);
                }
            });
        }
    }
}

function isPrimitiveEdge(edge: unknown): edge is ElkPrimitiveEdge {
    return (
        typeof (edge as ElkPrimitiveEdge).source === "string" && typeof (edge as ElkPrimitiveEdge).target === "string"
    );
}
