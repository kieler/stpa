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

import { SEdge, SNode, connectableFeature, fadeFeature, hoverFeedbackFeature, layoutContainerFeature, popupFeature, selectFeature } from "sprotty";



// The types of diagram elements
export const FTA_NODE_TYPE = 'node:fta';
export const TREE_TYPE = 'node:tree';
export const FTA_EDGE_TYPE = 'edge:fta';



/**
 * Node representing a FTA component.
 */
export class FTANode extends SNode{
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];

    nodeType: FTNodeType = FTNodeType.UNDEFINED;
    description: string = "";
    highlight?: boolean;
    k?: number;
    n?: number;

}

/**
 * Edge representing an edge in the fault tree.
 */
export class FTAEdge extends SEdge {
    highlight?: boolean;
}


/**
 * The different types of nodes of FTA.
 */
export enum FTNodeType {
    TOPEVENT,
    COMPONENT,
    CONDITION,
    AND,
    OR,
    KN,
    INHIBIT,
    UNDEFINED
}