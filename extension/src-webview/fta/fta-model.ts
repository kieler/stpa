/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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

import {
    Point,
    SEdge,
    SGraph,
    SNode,
    SPort,
    connectableFeature,
    fadeFeature,
    hoverFeedbackFeature,
    layoutContainerFeature,
    popupFeature,
    selectFeature
} from "sprotty";

/* fault tree element types */
export const FTA_NODE_TYPE = "node:fta";
export const FTA_DESCRIPTION_NODE_TYPE = "node:fta:description";
export const FTA_EDGE_TYPE = "edge:fta";
export const FTA_INVISIBLE_EDGE_TYPE = "edge:fta:invisible";
export const FTA_GRAPH_TYPE = "graph:fta";
export const FTA_PORT_TYPE = "port:fta";

/**
 * Node of a fault tree.
 */
export class FTANode extends SNode {
    static readonly DEFAULT_FEATURES = [
        connectableFeature,
        selectFeature,
        layoutContainerFeature,
        fadeFeature,
        hoverFeedbackFeature,
        popupFeature,
    ];

    name: string;
    nodeType: FTNodeType = FTNodeType.UNDEFINED;
    description: string = "";
    topOfAnalysis?: boolean;
    inCurrentSelectedCutSet?: boolean;
    notConnectedToSelectedCutSet?: boolean;
    k?: number;
    n?: number;
}

export class FTAGraph extends SGraph {
    modelOrder?: boolean;
}

export class DescriptionNode extends SNode {
    static readonly DEFAULT_FEATURES = [
        connectableFeature,
        selectFeature,
        layoutContainerFeature,
        fadeFeature,
        hoverFeedbackFeature,
        popupFeature,
    ];

    name: string;
    inCurrentSelectedCutSet?: boolean;
    notConnectedToSelectedCutSet?: boolean;
}

/**
 * Edge of a fault tree.
 */
export class FTAEdge extends SEdge {
    notConnectedToSelectedCutSet?: boolean;
    junctionPoints?: Point[];
}

/** Port representing a port in the FTA graph. */
export class FTAPort extends SPort {
    side?: PortSide;
}

/**
 * Types of fault tree nodes.
 */
export enum FTNodeType {
    TOPEVENT,
    COMPONENT,
    CONDITION,
    AND,
    OR,
    KN,
    INHIBIT,
    PARENT,
    UNDEFINED,
}

/** Possible sides for a port. */
export enum PortSide {
    WEST,
    EAST,
    NORTH,
    SOUTH,
}
