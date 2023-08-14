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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { LayoutOptions } from 'elkjs';
import { DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { SGraph, SModelIndex, SNode, SPort } from 'sprotty-protocol';
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

    /**
     * Options for the parent nodes of the STPA graph and the control structure
     */
    protected grandparentNodeOptions(snode: SNode, index: SModelIndex): LayoutOptions {
        let direction = '';
        // priority is used to determine the order of the nodes
        let priority = '';
        if (snode.children?.find(child => child.type === CS_NODE_TYPE)) {
            // options for the control structure
            direction = 'DOWN';
            priority = '1';
        } else if (snode.children?.find(child => child.type === STPA_NODE_TYPE)) {
            // options for the STPA graph
            direction = 'UP';
            priority = '0';
        }

        return {
            'org.eclipse.elk.layered.thoroughness': '70',
            'org.eclipse.elk.partitioning.activate': 'true',
            'org.eclipse.elk.direction': direction,
            // nodes with many edges are streched 
            'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'org.eclipse.elk.layered.nodePlacement.networkSimplex.nodeFlexibility.default': 'NODE_SIZE',
            'org.eclipse.elk.spacing.portPort': '10',
            // edges do no start at the border of the node
            'org.eclipse.elk.spacing.portsSurrounding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]',
            'org.eclipse.elk.priority': priority,
            // model order is used to determine the order of the children
            'org.eclipse.elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            'org.eclipse.elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
            'org.eclipse.elk.separateConnectedComponents': 'false'
        };
    }

    protected nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        // TODO: check whether model order option is activated
        switch (snode.type) {
            case CS_NODE_TYPE:
                return this.csNodeOptions(snode as CSNode);
            case STPA_NODE_TYPE:
                return this.stpaNodeOptions(snode as STPANode);
            case PARENT_TYPE:
                return this.grandparentNodeOptions(snode, index);
        }
    }

    protected stpaNodeOptions(node: STPANode): LayoutOptions {
        if (node.children?.find(child => child.type.startsWith('node'))) {
            return this.parentSTPANodeOptions(node);
        } else {
            return {
                'org.eclipse.elk.nodeLabels.placement': "INSIDE V_CENTER H_CENTER",
                'org.eclipse.elk.partitioning.partition': "" + node.level,
                'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
                'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS',
            };
        }
    }

    protected parentSTPANodeOptions(node: STPANode): LayoutOptions {
        // options for nodes in the STPA graphs that have children
        return {
            'org.eclipse.elk.direction': 'UP',
            'org.eclipse.elk.nodeLabels.placement': "INSIDE V_TOP H_CENTER",
            'org.eclipse.elk.partitioning.partition': "" + node.level,
            'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS',
            // nodes with many edges are streched 
            'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'org.eclipse.elk.layered.nodePlacement.networkSimplex.nodeFlexibility.default': 'NODE_SIZE',
            // edges do no start at the border of the node
            'org.eclipse.elk.spacing.portsSurrounding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]',
            'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
            // model order is used to determine the order of the children
            'org.eclipse.elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            'org.eclipse.elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
            'org.eclipse.elk.separateConnectedComponents': 'false'
        };
    }

    protected csNodeOptions(node: CSNode): LayoutOptions {
        return {
            'org.eclipse.elk.nodeLabels.placement': "INSIDE V_CENTER H_CENTER",
            'org.eclipse.elk.partitioning.partition': "" + node.level,
            'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS',
            // edges do no start at the border of the node
            'org.eclipse.elk.spacing.portsSurrounding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]',
            'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
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
