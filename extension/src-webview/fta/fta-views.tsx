/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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

/** @jsx svg */
import { injectable } from 'inversify';
import { VNode } from "snabbdom";
import { Point, PolylineEdgeView, RectangularNodeView, RenderingContext, SGraph, SGraphView, svg } from 'sprotty';
import { renderAndGate, renderCircle, renderInhibitGate, renderKnGate, renderOrGate, renderRectangle } from "../views-rendering";
import { FTAEdge, FTANode, FTNodeType } from './fta-model';

@injectable()
export class PolylineArrowEdgeViewFTA extends PolylineEdgeView {

    protected renderLine(edge: FTAEdge, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }
        // if an FTANode is selected, the components not connected to it should fade out
        return <path class-fta-edge={true} class-greyed-out={edge.notConnectedToSelectedCutSet} d={path} />;
    }

}

@injectable()
export class FTANodeView extends RectangularNodeView {

    render(node: FTANode, context: RenderingContext): VNode {
        // create the element based on the type of the node
        let element: VNode;
        switch (node.nodeType) {
            case FTNodeType.TOPEVENT:
                element = renderRectangle(node);
                break;
            case (FTNodeType.COMPONENT || FTNodeType.CONDITION):
                element = renderCircle(node);
                break;
            case FTNodeType.CONDITION:
                element = renderCircle(node);
                break;
            case FTNodeType.AND:
                element = renderAndGate(node);
                break;
            case FTNodeType.OR:
                element = renderOrGate(node);
                break;
            case FTNodeType.KN:
                element = renderKnGate(node, node.k as number, node.n as number);
                break;
            case FTNodeType.INHIBIT:
                element = renderInhibitGate(node);
                break;
            default:
                element = renderRectangle(node);
                break;
        }

        // if a cut set is selected, highlight the nodes in it and grey out not-connected elements
        return <g
            class-fta-node={true}
            class-mouseover={node.hoverFeedback}
            class-greyed-out={node.notConnectedToSelectedCutSet}>
            <g class-node-selected={node.selected} class-fta-highlight-node={node.inCurrentSelectedCutSet}>{element}</g>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class FTAGraphView extends SGraphView {

    render(model: Readonly<SGraph>, context: RenderingContext): VNode {
        if (model.children.length !== 0) {
            this.highlightConnectedToCutSet(model.children[0] as FTANode);
        }

        return super.render(model, context);
    }

    protected highlightConnectedToCutSet(node: FTANode): void {
        for (const edge of node.outgoingEdges) {
            (edge as FTAEdge).notConnectedToSelectedCutSet = true;
            const target = edge.target as FTANode;
            this.highlightConnectedToCutSet(target);
            if (!target.notConnectedToSelectedCutSet) {
                node.notConnectedToSelectedCutSet = false;
                (edge as FTAEdge).notConnectedToSelectedCutSet = false;
            }
        }
    }

}