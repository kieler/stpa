import { LayoutOptions } from 'elkjs';
import { DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { SGraph, SModelElement, SModelIndex, SNode } from 'sprotty-protocol';
import { CS_NODE_TYPE, PARENT_TYPE } from './stpa-model';


export class STPALayoutConfigurator extends DefaultLayoutConfigurator {

    protected graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.direction': 'DOWN',
            'org.eclipse.elk.spacing.nodeNode': '30.0',
            'org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers': '30.0'
        };
    }

    protected parentNodeOptions(snode: SNode, index: SModelIndex): LayoutOptions {
        let children = 'INCLUDE_CHILDREN'
        let direction = 'UP'
        if (snode.children && snode.children[0].type == CS_NODE_TYPE) {
            children = 'SEPARATE_CHILDREN'
            direction = 'DOWN'
        }
        return {
            'org.eclipse.elk.direction': direction,
            'org.eclipse.elk.algorithm': 'layered',
            // interactive strategies are used to be able to assign layers to nodes through positioning
            'org.eclipse.elk.separateConnectedComponents': 'false',
            'org.eclipse.elk.layered.crossingMinimization.semiInteractive': 'true',
            'cycleBreaking.strategy': 'INTERACTIVE',
            'layering.strategy': 'INTERACTIVE',
            // needed for cross-hierarchy edges
            'org.eclipse.elk.hierarchyHandling': children
        };
    }

    apply(element: SModelElement, index: SModelIndex): LayoutOptions | undefined {
        // special options for parent nodes
        if (element.type == PARENT_TYPE) {
            return this.parentNodeOptions(element as SNode, index)
        } else {
            return super.apply(element, index)
        }
    }

}
