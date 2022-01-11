import { LayoutOptions } from 'elkjs';
import { DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { getBasicType, SEdge, SGraph, SLabel, SModelElement, SModelIndex, SNode, SPort, SShapeElement } from 'sprotty-protocol';
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

    protected nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.direction': 'DOWN',
            'org.eclipse.elk.separateConnectedComponents': 'false',
            'org.eclipse.elk.algorithm': 'layered',
            'org.eclipse.elk.layered.crossingMinimization.semiInteractive': 'true',
            'cycleBreaking.strategy': 'INTERACTIVE',
            'layering.strategy': 'INTERACTIVE'
        };
    }

    protected portOptions(sport: SPort, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.port.side': 'NORTH',
            'org.eclipse.elk.port.borderOffset': '3.0'
        };
    }

    apply(element: SModelElement, index: SModelIndex): LayoutOptions | undefined {
        switch (getBasicType(element)) {
            case 'graph':
                return this.graphOptions(element as SGraph, index)
            case 'node':
                if (element.type == STPA_NODE_TYPE) {
                    const layer: number = determineLayerForSTPANode(element as STPANode);
                    (element as SShapeElement).position = {x: 100 * layer, y: 100 * layer}
                    return {
                        'org.eclipse.elk.port.side': 'DOWN',
                        'org.eclipse.elk.port.borderOffset': '3.0'
                    }
                } else if (element.type == CS_NODE_TYPE) {
                    //const layer = element.layer
                    const layer = (element as CSNode).level;
                    if (layer) {
                        (element as SShapeElement).position = {x: 100 * layer, y: 100 * layer}
                    }
                    return {
                        'org.eclipse.elk.port.side': 'DOWN',
                        'org.eclipse.elk.port.borderOffset': '3.0'
                    }
                } else if (element.type == PARENT_TYPE) {
                    return this.nodeOptions(element as SNode, index)
                }
            case 'edge':
                return super.edgeOptions(element as SEdge, index)
            case 'label':
                return super.labelOptions(element as SLabel, index)
            case 'port':
                return super.portOptions(element as SPort, index)
            default:
                return undefined
        }
    }

}
