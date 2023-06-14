/** @jsx svg */
import { inject, injectable } from 'inversify';
import { VNode } from "snabbdom";
import { Point, PolylineEdgeView, RectangularNodeView, RenderingContext, SEdge, SPort, svg } from 'sprotty';
import { DISymbol } from "./di.symbols";
import { FTAAspect, FTANode } from './fta-model';
import { ColorStyleOption, RenderOptionsRegistry } from './options/render-options-registry';
import { renderAndGate, renderCircle, renderInhibitGate, renderKnGate, renderOrGate, renderRectangle } from "./views-rendering";


/** Determines if path/aspect highlighting is currently on. */
let highlighting: boolean;

@injectable()
export class PolylineArrowEdgeViewFTA extends PolylineEdgeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry;

    protected renderLine(edge: SEdge, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }


        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption); 
        return <path class-print-node={true} class-fta-edge={false} aspect={(edge.source as FTANode).aspect} d={path} />;
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
    
    render(node: FTANode, context: RenderingContext): VNode {
        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption);
        const printNode = colorStyle == "black & white";
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
        return <g
            class-print-node={true}
            class-sprotty-port={node instanceof SPort}
            class-fta-node={false} aspect={node.aspect}
            class-mouseover={node.hoverFeedback}>
            <g class-node-selected={node.selected}>{element}</g>
            {context.renderChildren(node)}
        </g>;
    }
}
