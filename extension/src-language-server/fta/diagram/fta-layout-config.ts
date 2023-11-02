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
import { SModelIndex, SNode } from "sprotty-protocol";
import { FTAGraph, FTANode, FTAPort } from "./fta-interfaces";
import { FTA_DESCRIPTION_NODE_TYPE, FTA_NODE_TYPE, FTA_PORT_TYPE, FTNodeType, PortSide } from "./fta-model";

export class FtaLayoutConfigurator extends DefaultLayoutConfigurator {
    protected graphOptions(sgraph: FTAGraph, _index: SModelIndex): LayoutOptions {
        const options: LayoutOptions = {
            "org.eclipse.elk.direction": "DOWN",
            "org.eclipse.elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
            "org.eclipse.elk.portConstraints": "FIXED_SIDE",
            "org.eclipse.elk.hierarchyHandling": "INCLUDE_CHILDREN",
            "org.eclipse.elk.spacing.portPort": "0.0",
        };

        if (sgraph.modelOrder) {
            options["org.eclipse.elk.layered.nodePlacement.networkSimplex.nodeOrdering"] = "NODES_AND_EDGES";
            options["org.eclipse.elk.layered.crossingMinimization.forceNodeModelOrder"] = "true";
            options["org.eclipse.elk.separateConnectedComponents"] = "false";
        }
        return options;
    }

    protected nodeOptions(snode: SNode, _index: SModelIndex): LayoutOptions | undefined {
        const options: LayoutOptions = {
            "org.eclipse.elk.portConstraints": "FIXED_SIDE",
            "org.eclipse.elk.spacing.portPort": "0.0",
            "org.eclipse.elk.nodeLabels.placement": "INSIDE V_CENTER H_CENTER",
        };
        switch (snode.type) {
            case FTA_NODE_TYPE:
                switch ((snode as FTANode).nodeType) {
                    case FTNodeType.PARENT:
                        options["org.eclipse.elk.direction"] = "DOWN";
                        options["org.eclipse.elk.padding"] = "[top=0.0,left=0.0,bottom=10.0,right=0.0]";
                        options["org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers"] = "2";
                        options["org.eclipse.elk.hierarchyHandling"] = "INCLUDE_CHILDREN";
                        break;
                    case FTNodeType.COMPONENT:
                    case FTNodeType.CONDITION:
                        options["org.eclipse.elk.nodeSize.constraints"] = "MINIMUM_SIZE, NODE_LABELS";
                        options["org.eclipse.elk.nodeSize.minimum"] = "(30, 30)";
                        options["org.eclipse.elk.spacing.labelNode"] = "20.0";
                        break;
                }
                break;
            case FTA_DESCRIPTION_NODE_TYPE:
                options["org.eclipse.elk.nodeSize.constraints"] = "NODE_LABELS";
                break;
        }
        return options;
    }

    protected portOptions(sport: FTAPort, index: SModelIndex): LayoutOptions | undefined {
        if (sport.type === FTA_PORT_TYPE) {
            let side = "";
            switch ((sport as FTAPort).side) {
                case PortSide.WEST:
                    side = "WEST";
                    break;
                case PortSide.EAST:
                    side = "EAST";
                    break;
                case PortSide.NORTH:
                    side = "NORTH";
                    break;
                case PortSide.SOUTH:
                    side = "SOUTH";
                    break;
            }
            return {
                "org.eclipse.elk.port.side": side,
            };
        }
    }
}
