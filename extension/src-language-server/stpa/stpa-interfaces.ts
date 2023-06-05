/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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

import { SNode, SEdge } from "sprotty-protocol";
import { EdgeType, STPAAspect } from "./stpa-model";

/**
 * Node representing a STPA component.
 */
export interface STPANode extends SNode {
    aspect: STPAAspect
    description: string
    hierarchyLvl: number
    highlight?: boolean
    level?: number
    controlAction?: string
}

/**
 * Edge representing an edge in the relationship graph.
 */
 export interface STPAEdge extends SEdge {
    highlight?: boolean
}

/**
 * Node representing a system component in the control structure.
 */
export interface CSNode extends SNode {
    level?: number
    // processmodel?
}

/**
 * Edge representing control actions and feedback in the control structure.
 */
export interface CSEdge extends SEdge {
    edgeType: EdgeType
}
