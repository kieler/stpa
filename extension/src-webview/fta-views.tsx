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
import { inject, injectable } from 'inversify';
import { VNode } from "snabbdom";
import { Point, PolylineEdgeView, RectangularNodeView, RenderingContext, svg } from 'sprotty';
import { DISymbol } from "./di.symbols";
import { FTAEdge, FTANode, FTNodeType } from './fta-model';
import { CutSetsRegistry } from './options/cut-set-registry';
import { renderAndGate, renderCircle, renderInhibitGate, renderKnGate, renderOrGate, renderRectangle } from "./views-rendering";

// TODO: combine with STPA methods ??

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
        edge.highlight = (edge.target as FTANode).highlight;
        return <path class-fta-edge={true} class-greyed-out={!edge.highlight} d={path} />;
    }

}

@injectable()
export class FTANodeView extends RectangularNodeView {

    @inject(DISymbol.CutSetsRegistry) cutSetsRegistry: CutSetsRegistry;

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

        // if a cut set is selected, highlight the nodes in it and the connected elements
        const set = this.cutSetsRegistry.getCurrentValue();
        let highlight = false;
        if (set) {
            switch (node.nodeType) {
                case FTNodeType.COMPONENT:
                case FTNodeType.CONDITION:
                    // components and conditions should be highlighted when included in the selected cut set
                    const included = set.includes(node.name);
                    node.highlight = included;
                    highlight = included;
                    break;
                default:
                    // gates are hidden (greyed out) when not connected to shown elements
                    node.highlight = this.connectedToShown(node, set);
                    break;
            }
        } else {
            node.highlight = true;
        }
        // TODO: replace highlight attribute with hidden
        return <g
            class-fta-node={true}
            class-mouseover={node.hoverFeedback}
            class-greyed-out={!node.highlight}>
            <g class-node-selected={node.selected} class-fta-highlight-node={highlight}>{element}</g>
            {context.renderChildren(node)}
        </g>;
    }

    /**
     * Checks whether the given {@code node} is connected to a highlighted node.
     * @param node The node that should be checked.
     * @param set The set of all highlighted nodes.
     * @returns true if the node is connected to a node from the {@code set} or false otherwise.
     */
    connectedToShown(node: FTANode, set: any): boolean {
        // TODO: call this method only one time at the top node and highlight everything on the way that should be highlighted
        for (const edge of node.outgoingEdges) {
            const target = (edge.target as FTANode);
            switch (target.nodeType) {
                case FTNodeType.COMPONENT:
                case FTNodeType.CONDITION:
                    if (set.includes(target.name)) {
                        return true;
                    }
                    break;
                default:
                    if (this.connectedToShown(target, set)) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }
}
