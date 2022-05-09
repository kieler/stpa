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
import { STPANode, PARENT_TYPE, STPA_NODE_TYPE, CS_EDGE_TYPE, STPAAspect, STPAEdge, STPA_EDGE_TYPE } from './stpa-model';
import { renderCircle, renderDiamond, renderHexagon, renderMirroredTriangle, renderPentagon, renderRectangle, renderTrapez, renderTriangle } from './views-rendering';
import { inject } from 'inversify'
import { collectAllChildren, flagConnectedElements, getSelectedNode } from './helper-methods';
import { DISymbol } from './di.symbols';
import { ColorStyleOption, DifferentFormsOption, RenderOptionsRegistry } from './options/render-options-registry';

let selectedNode: SNode | undefined

@injectable()
export class PolylineArrowEdgeView extends PolylineEdgeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry

    protected renderLine(edge: SEdge, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }

        // if an STPANode is selected, the components not connected to it should fade out
        const hidden = edge.type == STPA_EDGE_TYPE && selectedNode && !(edge as STPAEdge).connected
   
        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption)
        const printEdge = colorStyle == "print"
        const coloredEdge = colorStyle == "colorful"
        return <path class-print-edge={printEdge} class-stpa-edge={coloredEdge} class-hidden={hidden} aspect={(edge.source as STPANode).aspect } d={path} />;
    }

    protected renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        // if an STPANode is selected, the components not connected to it should fade out
        const hidden = edge.type == STPA_EDGE_TYPE && selectedNode && !(edge as STPAEdge).connected
        if (edge.type == STPA_EDGE_TYPE) {
            (edge as STPAEdge).connected = false
        }

        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];

        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption)
        const printEdge = colorStyle == "print"
        const coloredEdge = colorStyle == "colorful" && edge.type != CS_EDGE_TYPE
        const sprottyEdge = colorStyle == "standard" || (edge.type == CS_EDGE_TYPE && !printEdge)
        return [
            <path class-print-edge-arrow={printEdge} class-stpa-edge-arrow={coloredEdge} class-hidden={hidden} aspect={(edge.source as STPANode).aspect}
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
    
    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry

    render(node: STPANode, context: RenderingContext): VNode {
        // create the element based on the option and the aspect of the node
        let element: VNode
        if (this.renderOptionsRegistry.getValue(DifferentFormsOption)) {
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
        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption)
        const printNode = colorStyle == "print"
        const coloredNode = colorStyle == "colorful"
        const sprottyNode = colorStyle == "standard"

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
    
    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry

    render(node: SNode, context: RenderingContext): VNode {

        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption)
        const printNode = colorStyle == "print"
        const sprottyNode = colorStyle != "print"
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
        // if an STPANode is selected, the "connected" attribute is set for the nodes and edges connected to the selected node
        let allNodes: SNode[] = []
        collectAllChildren(model.children as SNode[], allNodes)
        selectedNode = getSelectedNode(allNodes)
        if (selectedNode instanceof STPANode) {
            flagConnectedElements(selectedNode)
        }

        return super.render(model, context, args)
    }

}