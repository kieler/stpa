/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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

import { SEdge, SNode, SPort, connectableFeature, fadeFeature, layoutContainerFeature, selectFeature } from "sprotty";

// The types of diagram elements
export const STPA_NODE_TYPE = 'node:stpa';
export const PARENT_TYPE = 'node:parent';
export const CS_NODE_TYPE = 'node:cs';
export const INVISIBLE_NODE_TYPE = 'node:invisible';
export const PROCESS_MODEL_NODE_TYPE = 'node:processModel';
export const DUMMY_NODE_TYPE = 'node:dummy';
export const EDGE_TYPE = 'edge';
export const CS_EDGE_TYPE = 'edge:controlStructure';
export const STPA_EDGE_TYPE = 'edge:stpa';
export const STPA_INTERMEDIATE_EDGE_TYPE = 'edge:stpa-intermediate';
export const CS_INTERMEDIATE_EDGE_TYPE = 'edge:cs-intermediate';
export const PORT_TYPE = 'port:pasta';
export const HEADER_LABEL_TYPE = 'label:header';

export class ParentNode extends SNode {
    modelOrder: boolean;
}

/**
 * Node representing an STPA component.
 */
export class STPANode extends SNode {
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature, layoutContainerFeature, fadeFeature];

    aspect: STPAAspect = STPAAspect.UNDEFINED;
    description: string = "";
    hierarchyLvl: number = 0;
    highlight?: boolean;
    level?: number;
    controlAction?: string;
    modelOrder?: boolean;
}

/**
 * Edge representing an edge in the relationship graph.
 */
export class STPAEdge extends SEdge {
    aspect: STPAAspect = STPAAspect.UNDEFINED;
    highlight?: boolean;
    static readonly DEFAULT_FEATURES = [fadeFeature];
}

/** Port representing a port in the STPA graph. */
export class PastaPort extends SPort {
    side?: PortSide;
    assocEdge?: { node1: string; node2: string };
}

/**
 * Node representing a system component in the control structure.
 */
export class CSNode extends SNode {
    level?: number;
    // processmodel?
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature, layoutContainerFeature, fadeFeature];
}

/**
 * Edge representing control actions and feedback in the control structure.
 */
export class CSEdge extends SEdge {
    edgeType: EdgeType = EdgeType.UNDEFINED;
    static readonly DEFAULT_FEATURES = [fadeFeature];
}

/**
 * The different aspects of STPA.
 */
export enum STPAAspect {
    LOSS,
    HAZARD,
    SYSTEMCONSTRAINT,
    RESPONSIBILITY,
    UCA,
    CONTROLLERCONSTRAINT,
    SCENARIO,
    SAFETYREQUIREMENT,
    UNDEFINED,
}

/**
 * Possible edge types.
 */
export enum EdgeType {
    CONTROL_ACTION,
    FEEDBACK,
    INPUT,
    OUTPUT,
    UNDEFINED,
}

/** Possible sides for a port. */
export enum PortSide {
    WEST,
    EAST,
    NORTH,
    SOUTH,
}
