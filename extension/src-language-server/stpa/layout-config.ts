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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { LayoutOptions } from 'elkjs';
import { DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { SGraph, SModelElement, SModelIndex, SNode, SPort } from 'sprotty-protocol';
import { CSNode, STPANode, STPAPort } from './stpa-interfaces';
import { CS_NODE_TYPE, PARENT_TYPE, PortSide, STPA_NODE_TYPE, STPA_PORT_TYPE } from './stpa-model';


export class StpaLayoutConfigurator extends DefaultLayoutConfigurator {

    protected graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions {
        // options for the whole graph containing the control structure and the STPA graph
        return {
            'org.eclipse.elk.partitioning.activate': 'true',
            'org.eclipse.elk.direction': 'DOWN'
        };
    }

    protected grandparentNodeOptions(snode: SNode, index: SModelIndex): LayoutOptions {
        // in the STPA graph this is necessary for hierarchy-crossing edges to be better layouted
        let hierarchyHandling = 'INCLUDE_CHILDREN';
        let direction = 'UP';
        // the control structure is placed above the STPA graph
        let priority = '0';

        if (snode.children && snode.children[0] && snode.children[0].type === CS_NODE_TYPE) {
            // options for the control structure
            hierarchyHandling = 'SEPARATE_CHILDREN';
            direction = 'DOWN';
            priority = '1';
        }
        return {
            'org.eclipse.elk.layered.thoroughness': '70',
            // 'org.eclipse.elk.layered.layering.strategy': 'LONGEST_PATH',
            'org.eclipse.elk.partitioning.activate': 'true',
            'org.eclipse.elk.direction': direction,
            // nodes with many edges are streched 
            'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'org.eclipse.elk.layered.nodePlacement.networkSimplex.nodeFlexibility.default': 'NODE_SIZE',
            'org.eclipse.elk.spacing.portPort': '10',
            'org.eclipse.elk.spacing.portsSurrounding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]',
            'org.eclipse.elk.priority': priority
        };
    }

    protected nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        switch (snode.type) {
            case CS_NODE_TYPE:
                return this.csNodeOptions(snode as CSNode);
            case STPA_NODE_TYPE:
                return this.stpaNodeOptions(snode as STPANode);
            case PARENT_TYPE:
                return this.grandparentNodeOptions(snode, index);
        }
    }

    protected parentSTPANodeOptions(node: STPANode): LayoutOptions {
        return {
            'org.eclipse.elk.direction': 'UP',
            'org.eclipse.elk.nodeLabels.placement': "INSIDE V_TOP H_CENTER",
            'org.eclipse.elk.partitioning.partition': "" + node.level,
            'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS',
            'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'org.eclipse.elk.layered.nodePlacement.networkSimplex.nodeFlexibility.default': 'NODE_SIZE',
            'org.eclipse.elk.spacing.portsSurrounding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]',

            'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
            'org.eclipse.elk.separateConnectedComponents': 'false',
            'org.eclipse.elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            'org.eclipse.elk.layered.crossingMinimization.strategy': 'NONE',
            'org.eclipse.elk.layered.crossingMinimization.greedySwitch.type': 'OFF',
        };
    }

    protected stpaNodeOptions(node: STPANode): LayoutOptions {
        if (node.children?.find(child => child.type.startsWith('node'))) {
            return this.parentSTPANodeOptions(node);
        } else {
            return {
                'org.eclipse.elk.nodeLabels.placement': "INSIDE V_CENTER H_CENTER",
                'org.eclipse.elk.partitioning.partition': "" + node.level,
                'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
                // nodes with many edges are streched 
                'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS',
            };
        }
    }

    protected csNodeOptions(node: CSNode): LayoutOptions {
        return {
            'org.eclipse.elk.nodeLabels.placement': "INSIDE V_CENTER H_CENTER",
            'org.eclipse.elk.partitioning.partition': "" + node.level,
            // nodes with many edges are streched 
            'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS',
        };
    }

    protected portOptions(sport: SPort, index: SModelIndex): LayoutOptions | undefined {
        if (sport.type === STPA_PORT_TYPE) {
            let side = '';
            switch ((sport as STPAPort).side) {
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
