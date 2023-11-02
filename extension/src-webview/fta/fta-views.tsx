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
import { Hoverable, IViewArgs, Point, PolylineEdgeView, RectangularNodeView, RenderingContext, SEdge, SGraph, SGraphView, SShapeElement, Selectable, svg } from 'sprotty';
import { renderAndGate, renderEllipse, renderHorizontalLine, renderInhibitGate, renderKnGate, renderOrGate, renderOval, renderRectangle, renderRoundedRectangle, renderVerticalLine } from "../views-rendering";
import { DescriptionNode, FTAEdge, FTANode, FTAPort, FTA_EDGE_TYPE, FTA_NODE_TYPE, FTA_PORT_TYPE, FTNodeType } from './fta-model';

@injectable()
export class PolylineArrowEdgeViewFTA extends PolylineEdgeView {

    protected renderLine(edge: FTAEdge, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }
        // renderings for all junction points
        const junctionPointRenderings = edge.junctionPoints?.map(junctionPoint =>
            renderEllipse(junctionPoint.x, junctionPoint.y, 4, 4, 1)
        );

        // if an FTANode is selected, the components not connected to it should fade out
        return <g class-fta-edge={true} class-greyed-out={edge.notConnectedToSelectedCutSet}>
            <path d={path} />
            {...(junctionPointRenderings ?? [])}
        </g>;
    }

}

@injectable()
export class FTAInvisibleEdgeView extends PolylineArrowEdgeViewFTA {
    render(edge: Readonly<SEdge>, context: RenderingContext, args?: IViewArgs | undefined): VNode | undefined {
        return <g></g>;
    }
}

@injectable()
export class DescriptionNodeView extends RectangularNodeView {
    render(node: DescriptionNode, context: RenderingContext): VNode | undefined {
        const element = renderRectangle(node);
        const border1 = renderHorizontalLine(node);
        const border2 = renderHorizontalLine(node);
        const edge = renderVerticalLine(node);
        const translateBorder = `translate(0, ${Math.max(node.size.height, 0)})`;
        const translateEdge = `translate(${Math.max(node.size.width / 2.0, 0)}, 0)`;
        return <g
            class-fta-node={true}
            class-mouseover={node.hoverFeedback}
            class-greyed-out={node.notConnectedToSelectedCutSet}>
            <g class-vertical-edge={true} transform={translateEdge}>{edge}</g>
            <g class-gate-description={true} class-node-selected={node.selected} class-fta-highlight-node={node.inCurrentSelectedCutSet}>{element}</g>
            <g class-description-border={true}>{border1}</g>
            <g class-description-border={true} transform={translateBorder}>{border2}</g>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class FTANodeView extends RectangularNodeView {

    render(node: FTANode, context: RenderingContext): VNode {
        // create the element based on the type of the node
        let element: VNode;
        switch (node.nodeType) {
            case FTNodeType.PARENT:
                // parent is invisible
                return <g
                    class-fta-node={true}
                    class-mouseover={node.hoverFeedback}
                    class-greyed-out={false}>
                    {context.renderChildren(node)}
                </g>;
            case FTNodeType.TOPEVENT:
                element = renderRectangle(node);
                break;
            case FTNodeType.COMPONENT:
            case FTNodeType.CONDITION:
                element = renderRoundedRectangle(node, 15, 15);
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
            <g class-top-event={node.type === FTA_NODE_TYPE && node.topOfAnalysis} class-node-selected={node.selected} class-fta-highlight-node={node.inCurrentSelectedCutSet}>{element}</g>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class FTAGraphView extends SGraphView {

    render(model: Readonly<SGraph>, context: RenderingContext): VNode {
        if (model.children.length !== 0) {
            const topEvent = model.children.find(node => node instanceof FTANode && node.nodeType === FTNodeType.TOPEVENT);
            if (topEvent) {
                this.highlightConnectedToCutSet(model, topEvent as FTANode);
            }
        }

        return super.render(model, context);
    }

    protected highlightConnectedToCutSet(model: SGraph, currentNode: FTANode): void {
        for (const port of currentNode.children.filter(child => child.type === FTA_PORT_TYPE)) {
            const edge = model.children.find(child => child.type === FTA_EDGE_TYPE && (child as FTAEdge).sourceId === port.id) as FTAEdge;
            if (edge) {
                edge.notConnectedToSelectedCutSet = true;
                if (edge.target instanceof FTAPort) {
                    const target = (edge.target as FTAPort).parent as FTANode;
                    // handle successor nodes
                    this.highlightConnectedToCutSet(model, target);
                    // handle current node
                    if (!target.notConnectedToSelectedCutSet) {
                        currentNode.notConnectedToSelectedCutSet = false;
                        edge.notConnectedToSelectedCutSet = false;
                    }
                    // handle edges in parents
                    if (currentNode.nodeType === FTNodeType.PARENT) {
                        const innerEdge = currentNode.children.find(child => child.type === FTA_EDGE_TYPE && (child as FTAEdge).targetId === edge.sourceId) as FTAEdge;
                        innerEdge.notConnectedToSelectedCutSet = edge.notConnectedToSelectedCutSet;
                    }
                }
            }
        }
        // handle nodes in parents
        if (currentNode.nodeType === FTNodeType.PARENT) {
            currentNode.children.forEach(child => {
                if (child.type === FTA_NODE_TYPE) {
                    (child as FTANode).notConnectedToSelectedCutSet = currentNode.notConnectedToSelectedCutSet;
                }
            });
        }
    }

}