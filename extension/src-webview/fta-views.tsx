/** @jsx svg */
import { inject, injectable } from 'inversify';
import { VNode } from "snabbdom";
import { Point, PolylineEdgeView, RectangularNodeView, RenderingContext, SEdge, SPort, svg } from 'sprotty';
import { DISymbol } from "./di.symbols";
import { FTAAspect, FTAEdge, FTANode, FTA_EDGE_TYPE } from './fta-model';
import { ColorStyleOption, RenderOptionsRegistry } from './options/render-options-registry';
import { renderAndGate, renderCircle, renderInhibitGate, renderKnGate, renderOrGate, renderRectangle } from "./views-rendering";
import { CutSetsRegistry } from './options/cut-set-registry';


/** Determines if path/aspect highlighting is currently on. */
let highlightingFTA: boolean;

@injectable()
export class PolylineArrowEdgeViewFTA extends PolylineEdgeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.CutSetsRegistry) cutSetsRegistry: CutSetsRegistry;

    protected renderLine(edge: SEdge, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }

        highlightingFTA = this.cutSetsRegistry.getFtaHightlighting();
        // if an FTANode is selected, the components not connected to it should fade out
        const hidden = edge.type == FTA_EDGE_TYPE && highlightingFTA && !(edge as FTAEdge).highlight;

        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption); 
        return <path class-print-node={true} class-fta-edge={false} class-hidden={hidden} aspect={(edge.source as FTANode).aspect} d={path} />;
    }
    /*
    protected renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];

        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption);
        return [
            <path class-fta-edge-arrow={true} aspect={(edge.source as FTANode).aspect} />
        ];
    }
    */
}


@injectable()
export class FTANodeView extends RectangularNodeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.CutSetsRegistry) cutSetsRegistry: CutSetsRegistry;
    
    render(node: FTANode, context: RenderingContext): VNode {
        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption);
        const printNode = colorStyle == "black & white";
        const sprottyNode = colorStyle == "standard";
        const coloredNode = colorStyle == "colorful";

        // create the element based on the aspect of the node
        let element: VNode;
        switch (node.aspect) {
            case FTAAspect.TOPEVENT:
                element = renderRectangle(node);
                break;
            case FTAAspect.COMPONENT:
                element = renderCircle(node);
                break;
            case FTAAspect.CONDITION:
                element = renderCircle(node);
                break;
            case FTAAspect.AND:
                element = renderAndGate(node);
                break;
            case FTAAspect.OR:
                element = renderOrGate(node);
                break;
            case FTAAspect.KN:
                element = renderKnGate(node, node.k as number, node.n as number);
                break;
            case FTAAspect.INHIBIT:
                element = renderInhibitGate(node);
                break;
            default:
                element = renderRectangle(node);
                break;   
        }

        highlightingFTA = this.cutSetsRegistry.getFtaHightlighting();
        //if an FTANode is selected, the components not connected to it should fade out
        const hidden = highlightingFTA && !node.highlight;

        return <g
            //change this when different color options exist
            class-print-node={true}
            class-sprotty-node={sprottyNode}
            class-sprotty-port={node instanceof SPort}
            class-fta-node={false} aspect={node.aspect}
            class-mouseover={node.hoverFeedback}
            class-hidden={hidden}>
            <g class-node-selected={node.selected}>{element}</g>
            {context.renderChildren(node)}
        </g>;
    }
}