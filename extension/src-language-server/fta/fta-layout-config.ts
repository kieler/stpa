import { LayoutOptions } from 'elkjs';
import { DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { SEdge, SGraph, SModelElement, SModelIndex, SNode } from 'sprotty-protocol';
import { FTANode } from './fta-interfaces';
import { FTAAspect, FTA_NODE_TYPE } from './fta-model';

export class FtaLayoutConfigurator extends DefaultLayoutConfigurator {
    
    
    protected graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions {
        //options for the entire graph.
        return {
            'org.eclipse.elk.partitioning.activate': 'true',
            'org.eclipse.elk.spacing.nodeNode': '30.0',
            'org.eclipse.elk.direction': 'DOWN',
            'org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers': '30.0',
            'org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers': '30.0',   
        };
    }

    protected nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions | undefined {
        //options for the nodes. 
        const level = (snode as FTANode).level; 
        return {
            'org.eclipse.elk.layered.thoroughness': '70',
            'org.eclipse.elk.partitioning.activate': 'true',
            'org.eclipse.elk.nodeLabels.placement': "INSIDE V_CENTER H_CENTER",
            'org.eclipse.elk.partitioning.partition': "" + level,
            'org.eclipse.elk.layered.nodePlacement.layerConstraint': "" + level,

            //'org.eclipse.elk.nodeSize.constraints': 'NODE_LABELS',
            'org.eclipse.elk.direction' : 'DOWN',
            'org.eclipse.elk.algorithm': 'layered',
            'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'org.eclipse.elk.spacing.portsSurrounding': '[top=10.0,left=10.0,bottom=10.0,right=10.0]'
        }  
    }    
}