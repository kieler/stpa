import { LayoutOptions } from 'elkjs';
import { DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { SGraph, SModelElement, SModelIndex, SNode, SShapeElement } from 'sprotty-protocol';
import { CSNode, STPANode } from './STPA-interfaces';
import { CS_NODE_TYPE, PARENT_TYPE, STPA_NODE_TYPE } from './STPA-model';
import { determineLayerForSTPANode } from './utils';


export class STPALayoutConfigurator extends DefaultLayoutConfigurator {

    protected graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.direction': 'DOWN',
            'org.eclipse.elk.spacing.nodeNode': '30.0',
            'org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers': '30.0'
        };
    }

    protected parentNodeOptions(snode: SNode, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.direction': 'UP',
            'org.eclipse.elk.algorithm': 'layered',
            // interactive strategies are used to be able to assign layers to nodes through positioning
            'org.eclipse.elk.separateConnectedComponents': 'false',
            'org.eclipse.elk.layered.crossingMinimization.semiInteractive': 'true',
            'cycleBreaking.strategy': 'INTERACTIVE',
            'layering.strategy': 'INTERACTIVE',
            // needed for cross-hierarchy edges
            'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN'
        };
    }

    apply(element: SModelElement, index: SModelIndex): LayoutOptions | undefined {
        if (element.type == STPA_NODE_TYPE) {
            // each aspect gets its own layer
            const layer: number = determineLayerForSTPANode(element as STPANode);
            (element as SShapeElement).position = {x: 0, y: 1000 * layer}
        } else if (element.type == CS_NODE_TYPE) {
            const layer = (element as CSNode).level;
            if (layer) {
                // each hierarchy level in the control structure gets its own layer
                (element as SShapeElement).position = {x: 0, y: 100 * layer}
            }
        } 
        // special options for parent nodes
        if (element.type == PARENT_TYPE) {
            return this.parentNodeOptions(element as SNode, index)
        } else {
            return super.apply(element, index)
        }
    }

}
