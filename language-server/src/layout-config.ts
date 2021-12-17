import { LayoutOptions } from 'elkjs';
import { DefaultLayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { SGraph, SModelIndex, SNode, SPort } from 'sprotty-protocol';

export class STPALayoutConfigurator extends DefaultLayoutConfigurator {

    protected graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.direction': 'DOWN',
            'org.eclipse.elk.spacing.nodeNode': '30.0',
            //'org.eclipse.elk.interactieLayout': 'true',
            'org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers': '30.0'
        };
    }

    protected nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.portAlignment.default': 'CENTER',
            'org.eclipse.elk.portConstraints': 'FIXED_SIDE'
        };
    }

    protected portOptions(sport: SPort, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.port.side': 'NORTH',
            'org.eclipse.elk.port.borderOffset': '3.0'
        };
    }

/*     apply(element: SModelElement, index: SModelIndex): LayoutOptions | undefined {
        switch (getBasicType(element)) {
            case 'graph':
                return this.graphOptions(element as SGraph, index)
            case 'node':
                if (element instanceof STPANode) {
                    const layer = determineLayerForSTPANode(element)
                    return {
                        'org.eclipse.elk.port.side': 'NORTH',
                        'org.eclipse.elk.port.borderOffset': '3.0',
                        'org.eclipse.elk.layered.layering.layerChoiceConstraint': layer
                    }
                }
                if (element instanceof CSNode) {
                    const layer = element.layer
                    return {
                        'org.eclipse.elk.port.side': 'NORTH',
                        'org.eclipse.elk.port.borderOffset': '3.0',
                        'org.eclipse.elk.layered.layering.layerChoiceConstraint': layer
                    }
                }
                return this.nodeOptions(element as SNode, index)
            case 'edge':
                return super.edgeOptions(element as SEdge, index)
            case 'label':
                return super.labelOptions(element as SLabel, index)
            case 'port':
                return super.portOptions(element as SPort, index)
            default:
                return undefined
        }
    } */

}
