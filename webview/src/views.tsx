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
import { VNode } from 'snabbdom';
import { Point, PolylineEdgeView, RectangularNodeView, RenderingContext, SEdge, SNode, svg, SPort, toDegrees, SGraphView, SGraph} from 'sprotty';
import { injectable } from 'inversify';
import { STPANode, PARENT_TYPE, STPA_NODE_TYPE, CS_EDGE_TYPE, STPAAspect } from './stpa-model';
import { renderCircle, renderDiamond, renderHexagon, renderMirroredTriangle, renderPentagon, renderRectangle, renderTrapez, renderTriangle } from './views-rendering';
import { ColorOption, DiagramOptions } from './diagram-options';
import { inject } from 'inversify'
import { collectAllChildren, getConnectedNodes, getSelectedNode } from './helper-methods';

let selectedNode: SNode | undefined

@injectable()
export class PolylineArrowEdgeView extends PolylineEdgeView {

    @inject(DiagramOptions)
    protected readonly options: DiagramOptions

    protected renderLine(edge: SEdge, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }
   
        const printEdge = this.options.getColor() == ColorOption.PRINT
        const coloredEdge = this.options.getColor() == ColorOption.COLORED
        return <path class-print-edge={printEdge} class-stpa-edge={coloredEdge} aspect={(edge.source as STPANode).aspect} d={path} />;
    }

    protected renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        const printEdge = this.options.getColor() == ColorOption.PRINT
        const coloredEdge = this.options.getColor() == ColorOption.COLORED && edge.type != CS_EDGE_TYPE
        const sprottyEdge = this.options.getColor() == ColorOption.STANDARD || (edge.type == CS_EDGE_TYPE && !printEdge)
        return [
            <path class-print-edge-arrow={printEdge} class-stpa-edge-arrow={coloredEdge} aspect={(edge.source as STPANode).aspect}
                  class-sprotty-edge-arrow={sprottyEdge} d="M 6,-3 L 0,0 L 6,3 Z"
                  transform={`rotate(${this.angle(p2, p1)} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`}/>
        ];
    }

    angle(x0: Point, x1: Point): number {
        return toDegrees(Math.atan2(x1.y - x0.y, x1.x - x0.x));
    }
}

@injectable()
export class STPANodeView extends RectangularNodeView  {

    @inject(DiagramOptions)
    protected readonly options: DiagramOptions

    render(node: STPANode, context: RenderingContext): VNode {
        // create the element based on the option and the aspect of the node
        let element: VNode
        if (this.options.getForms()) {
            switch(node.aspect) {
                case STPAAspect.LOSS: 
                    element = renderTrapez(node)
                    break
                case STPAAspect.HAZARD: 
                    element = renderRectangle(node)
                    break
                case STPAAspect.SYSTEMCONSTRAINT: 
                    element = renderHexagon(node)
                    break
                case STPAAspect.RESPONSIBILITY:
                    element = renderPentagon(node)
                    break
                case STPAAspect.UCA:
                    element = renderCircle(node)
                    break
                case STPAAspect.CONTROLLERCONSTRAINT:
                    element = renderMirroredTriangle(node)
                    break
                case STPAAspect.SCENARIO:
                    element = renderTriangle(node)
                    break
                case STPAAspect.SAFETYREQUIREMENT:
                    element = renderDiamond(node)
                    break
                default: 
                    element = renderRectangle(node)
                    break
            }
        } else {
            element = renderRectangle(node)
        }

        // if an STPANode is selected, the components not connected to it should fade out
        const hidden = (selectedNode instanceof STPANode) && !node.connected
        const parentNode = node.children.filter(child => child.type == STPA_NODE_TYPE).length != 0 && !hidden
        node.connected = false

        // determines the color of the node
        const printNode = this.options.getColor() == ColorOption.PRINT
        const coloredNode = this.options.getColor() == ColorOption.COLORED
        const sprottyNode = this.options.getColor() == ColorOption.STANDARD

        return  <g  
                    class-print-node={printNode}
                    class-stpa-node={coloredNode} aspect={node.aspect}
                    class-sprotty-node={sprottyNode}
                    class-sprotty-port={node instanceof SPort}
                    class-mouseover={node.hoverFeedback} class-selected={node.selected}
                    class-hidden={hidden}>
                    <g class-parent-node={parentNode}>{element}</g>
                    {context.renderChildren(node)}
                </g>;
    }
}

@injectable()
export class CSNodeView extends RectangularNodeView {

    @inject(DiagramOptions)
    protected readonly options: DiagramOptions

    render(node: SNode, context: RenderingContext): VNode {
        const printNode = this.options.getColor() == ColorOption.PRINT
        const sprottyNode = this.options.getColor() != ColorOption.PRINT
        return <g>
            <rect class-parent-node={node.type == PARENT_TYPE} class-print-node={printNode}
                  class-sprotty-node={sprottyNode} class-sprotty-port={node instanceof SPort}
                  class-mouseover={node.hoverFeedback} class-selected={node.selected}
                  x="0" y="0" width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}
            > </rect>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class STPAGraphView<IRenderingArgs> extends SGraphView<IRenderingArgs> {

    render(model: Readonly<SGraph>, context: RenderingContext, args?: IRenderingArgs): VNode {
        // if an STPANode is selected, the "connected" attribute is set for the nodes connected to the selected one
        let allNodes: SNode[] = []
        collectAllChildren(model.children as SNode[], allNodes)
        selectedNode = getSelectedNode(allNodes)
        if (selectedNode instanceof STPANode) {
            const connectedNodes = getConnectedNodes(selectedNode)
            for (const node of connectedNodes) {
                (node as STPANode).connected = true
            }
        }

        return super.render(model, context, args)
    }

}