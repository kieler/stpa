/********************************************************************************
 * Copyright (c) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

/** @jsx svg */
import { svg } from 'snabbdom-jsx';

import { injectable } from 'inversify';
import { VNode } from 'snabbdom/vnode';
import { IView, Point, PolylineEdgeView, RenderingContext, SEdge, SPort, toDegrees} from 'sprotty';
import { STPANode } from './STPA-model';
import { getAspectColor } from './views-styles';

@injectable()
export class PolylineArrowEdgeView extends PolylineEdgeView {

    protected renderLine(edge: SEdge, segments: Point[], context: RenderingContext): VNode {
        const color = getAspectColor((edge.source as STPANode).aspect).color
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }
        return <path d={path} stroke={color}/>;
    }

    protected renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        return [
            <path class-sprotty-edge-arrow={true} d="M 6,-3 L 0,0 L 6,3 Z"
                  transform={`rotate(${this.angle(p2, p1)} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`}/>
        ];
    }

    angle(x0: Point, x1: Point): number {
        return toDegrees(Math.atan2(x1.y - x0.y, x1.x - x0.x));
    }
}

@injectable()
export class STPANodeView implements IView {
    render(node: STPANode, context: RenderingContext): VNode {
        const color = getAspectColor(node.aspect).color
        return <g>
            <rect /* class-sprotty-node={node instanceof STPANode} */ class-sprotty-port={node instanceof SPort}
                  class-mouseover={node.hoverFeedback} class-selected={node.selected}
                  x="0" y="0" width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}
                  fill={color}></rect>
            {context.renderChildren(node)}
        </g>;
    }
}
