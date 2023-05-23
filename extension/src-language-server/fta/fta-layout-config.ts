import { LayoutOptions } from 'elkjs';
import { DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { SEdge, SGraph, SModelElement, SModelIndex, SNode } from 'sprotty-protocol';
import { FTANode } from './fta-interfaces';

export class FtaLayoutConfigurator extends DefaultLayoutConfigurator {
    
    /*
    protected graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions {
        //super.graphOptions(sgraph, index);
        return {
            'org.eclipse.elk.direction': 'DOWN',
            'org.eclipse.elk.spacing.nodeNode': '30.0',
            'org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers': '30.0'
        };
    }

    protected nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        return {
            'org.eclipse.elk.nodeLabels.placement': "INSIDE V_CENTER H_CENTER",
            'org.eclipse.elk.partitioning.partition': "" + (snode as FTANode).level,
            // nodes with many edges are streched 
            'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS'
        }
    }

    protected edgeOptions(sedge: SEdge, index: SModelIndex): LayoutOptions | undefined {
        return{
            'org.eclipse.elk.direction': 'DOWN',
        }
    }
    

    apply(element: SModelElement, index: SModelIndex): LayoutOptions | undefined {
        return super.apply(element, index);
    }
    */
}