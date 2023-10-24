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
import { SGraph, SModelIndex } from "sprotty-protocol";
import { FTANode, FTAPort } from "./fta-interfaces";
import { FTA_PORT_TYPE, FTNodeType, PortSide } from "./fta-model";

export class FtaLayoutConfigurator extends DefaultLayoutConfigurator {
    protected graphOptions(_sgraph: SGraph, _index: SModelIndex): LayoutOptions {
        return {
            "org.eclipse.elk.direction": "DOWN",
            "org.eclipse.elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        };
    }

    protected nodeOptions(snode: FTANode, _index: SModelIndex): LayoutOptions | undefined {
        switch (snode.nodeType) {
            case FTNodeType.PARENT:
                return {
                    "org.eclipse.elk.direction": "DOWN",
                    "org.eclipse.elk.padding": "[top=0.0,left=0.0,bottom=10.0,right=0.0]",
                    "org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers": "0",
                };
            default:
                return {
                    "org.eclipse.elk.nodeLabels.placement": "INSIDE V_CENTER H_CENTER",
                };
        }
    }

    protected portOptions(sport: FTAPort, index: SModelIndex): LayoutOptions | undefined {
        if (sport.type === FTA_PORT_TYPE) {
            let side = '';
            switch ((sport as FTAPort).side) {
                case PortSide.WEST:
                    side = 'WEST';
                    break;
                case PortSide.EAST:
                    side = 'EAST';
                    break;
                case PortSide.NORTH:
                    side = 'NORTH';
                    break;
                case PortSide.SOUTH:
                    side = 'SOUTH';
                    break;
            }
            return {
                'org.eclipse.elk.port.side': side
            };
        }
    }
}
