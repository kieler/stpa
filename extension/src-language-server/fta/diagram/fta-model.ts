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

/* fault tree element types */
export const FTA_NODE_TYPE = "node:fta";
export const FTA_DESCRIPTION_NODE_TYPE = "node:fta:description";
export const FTA_EDGE_TYPE = "edge:fta";
export const FTA_INVISIBLE_EDGE_TYPE = "edge:fta:invisible";
export const FTA_GRAPH_TYPE = "graph:fta";
export const FTA_PORT_TYPE = 'port:fta';

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
    SOUTH
}
