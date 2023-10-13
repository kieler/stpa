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

import { LayoutOptions } from "elkjs";
import { DefaultLayoutConfigurator } from "sprotty-elk/lib/elk-layout";
import { SGraph, SModelIndex, SNode } from "sprotty-protocol";

export class FtaLayoutConfigurator extends DefaultLayoutConfigurator {
    protected graphOptions(_sgraph: SGraph, _index: SModelIndex): LayoutOptions {
        return {
            "org.eclipse.elk.direction": "DOWN",
            "org.eclipse.elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        };
    }

    protected nodeOptions(_snode: SNode, _index: SModelIndex): LayoutOptions | undefined {
        return {
            "org.eclipse.elk.nodeLabels.placement": "INSIDE V_CENTER H_CENTER",
        };
    }
}
