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

import { SEdge, SNode } from "sprotty-protocol";
import { FTNodeType } from "./fta-model";

/**
 * Node of a fault tree.
 */
export interface FTANode extends SNode {
    name: string;
    nodeType: FTNodeType;
    description: string;
    inCurrentSelectedCutSet?: boolean;
    notConnectedToSelectedCutSet?: boolean;
    k?: number;
    n?: number;
}

/**
 * Edge of a fault tree.
 */
export interface FTAEdge extends SEdge {
    notConnectedToSelectedCutSet?: boolean;
}