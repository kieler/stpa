/** @jsx svg */
import { inject, injectable } from 'inversify';
import { VNode } from "snabbdom";
import { RectangularNodeView, RenderingContext, SPort, svg } from 'sprotty';
import { DISymbol } from "./di.symbols";
import { FTAAspect, FTANode } from './fta-model';
import { ColorStyleOption, RenderOptionsRegistry } from "./options/render-options-registry";
import { renderAndGate, renderCircle, renderHexagon, renderInhibitGate, renderKnGate, renderOrGate, renderRectangle } from "./views-rendering";


/** Determines if path/aspect highlighting is currently on. */
let highlighting: boolean;


@injectable()
export class FTANodeView extends RectangularNodeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry;

    render(node: FTANode, context: RenderingContext): VNode {

        // determines the color of the node
        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption);
        const printNode = colorStyle == "black & white";
        const coloredNode = colorStyle == "colorful";
        const sprottyNode = colorStyle == "standard";
        const lessColoredNode = colorStyle == "fewer colors";
        const aspect = node.aspect % 2 == 0 || !lessColoredNode ? node.aspect : node.aspect - 1;

        // create the element based on the option and the aspect of the node
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
                element = renderAndGate(node);     //not correct yet
                break;
            case FTAAspect.OR:
                element = renderOrGate(node);      //not correct yet
                break;
            case FTAAspect.KN:
                element = renderKnGate(node, node.k as number, node.n as number);     //not correct yet
                break;
            case FTAAspect.INHIBIT:
                element = renderInhibitGate(node);     //wrong
                break;
            default:
                element = renderRectangle(node);
                break;   
        }
        return <g
            class-sprotty-port={node instanceof SPort}
            class-mouseover={node.hoverFeedback}>
            <g class-node-selected={node.selected}>{element}</g>
            {context.renderChildren(node)}
        </g>;
    }
}
