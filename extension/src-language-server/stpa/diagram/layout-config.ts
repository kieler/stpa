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
import { SGraph, SModelElement, SModelIndex, SNode } from 'sprotty-protocol';
import { CSNode, STPANode } from './stpa-interfaces';
import { CS_NODE_TYPE, PARENT_TYPE } from './stpa-model';


export class StpaLayoutConfigurator extends DefaultLayoutConfigurator {

    protected graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions {
        // options for the whole graph containing the control structure and the STPA graph
        return {
            'org.eclipse.elk.partitioning.activate': 'true',
            'org.eclipse.elk.direction': 'DOWN',
            'org.eclipse.elk.spacing.nodeNode': '30.0',
            'org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers': '30.0'
        };
    }

    protected parentNodeOptions(snode: SNode, index: SModelIndex): LayoutOptions {
        // in the STPA graph this is necessary for hierarchy-crossing edges to be better layouted
        let hierarchyHandling = 'INCLUDE_CHILDREN';
        let direction = 'UP';

        if (snode.children && snode.children[0] && snode.children[0].type === CS_NODE_TYPE) {
            // options for the control structure
            hierarchyHandling = 'SEPARATE_CHILDREN';
            direction = 'DOWN';
        }
        return {
            'org.eclipse.elk.layered.thoroughness': '70',
            // 'org.eclipse.elk.layered.layering.strategy': 'LONGEST_PATH',
            'org.eclipse.elk.partitioning.activate': 'true',
            'org.eclipse.elk.direction': direction,
            'org.eclipse.elk.algorithm': 'layered',
            'org.eclipse.elk.hierarchyHandling': hierarchyHandling,
            // nodes with many edges are streched 
            'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'org.eclipse.elk.layered.nodePlacement.networkSimplex.nodeFlexibility.default': 'NODE_SIZE',
            'org.eclipse.elk.spacing.edgeNode': '4',
            'org.eclipse.elk.spacing.portPort': '10',
            'org.eclipse.elk.spacing.portsSurrounding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]'
        };
    }

    protected nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        const parent = snode.children?.find(child => child.type.startsWith('node'));
        const partition = snode.type === CS_NODE_TYPE ? (snode as CSNode).level : (snode as STPANode).level;
        if (parent) {
            return {
                'org.eclipse.elk.nodeLabels.placement': "INSIDE V_TOP H_CENTER",
                'org.eclipse.elk.partitioning.partition': "" + partition,
                // nodes with many edges are streched 
                'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS',
                'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
                'org.eclipse.elk.layered.nodePlacement.networkSimplex.nodeFlexibility.default': 'NODE_SIZE',
                'org.eclipse.elk.spacing.portsSurrounding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]'
            };
        } else {
            return {
                'org.eclipse.elk.nodeLabels.placement': "INSIDE V_CENTER H_CENTER",
                'org.eclipse.elk.partitioning.partition': "" + partition,
                // nodes with many edges are streched 
                'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS'
            };
        }
    }

    apply(element: SModelElement, index: SModelIndex): LayoutOptions | undefined {
        // special options for parent nodes
        if (element.type === PARENT_TYPE) {
            return this.parentNodeOptions(element as SNode, index);
        } else {
            return super.apply(element, index);
        }
    }

}
