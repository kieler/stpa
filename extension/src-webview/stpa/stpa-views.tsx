/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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
import { VNode } from 'snabbdom';
import { IActionDispatcher, IView, IViewArgs, ModelRenderer, PolylineEdgeView, RectangularNodeView, RenderingContext, SEdgeImpl, SGraphImpl, SGraphView, SLabelImpl, SLabelView, SNodeImpl, SPortImpl, TYPES, svg } from 'sprotty';
import { Point, toDegrees } from "sprotty-protocol";
import { DISymbol } from '../di.symbols';
import { ColorStyleOption, DifferentFormsOption, FeedbackStyleOption, RenderOptionsRegistry, dottedFeedback, lightGreyFeedback } from '../options/render-options-registry';
import { SendModelRendererAction } from '../snippets/actions';
import { renderCollapseIcon, renderDiamond, renderEllipse, renderExpandIcon, renderHexagon, renderMirroredTriangle, renderOval, renderPentagon, renderRectangle, renderRoundedRectangle, renderTrapez, renderTriangle } from '../views-rendering';
import { collectAllChildren } from './helper-methods';
import { CSEdge, CSNode, CS_EDGE_TYPE, CS_INTERMEDIATE_EDGE_TYPE, CS_NODE_TYPE, EdgeType, STPAAspect, STPAEdge, STPANode, STPA_EDGE_TYPE, STPA_INTERMEDIATE_EDGE_TYPE } from './stpa-model';

/** Determines if path/aspect highlighting is currently on. */
let highlighting: boolean;

@injectable()
export class PolylineArrowEdgeView extends PolylineEdgeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry;

    protected renderLine(edge: SEdgeImpl, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];

        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            // adjust the last point if it is not an intermediate edge in order to draw the arrow correctly (not reaching into the target node)
            if ((edge.type === CS_EDGE_TYPE || edge.type === STPA_EDGE_TYPE) && i === segments.length - 1) {
                if (p1.x === p2.x) {
                    // edge goes down or up
                    if (p1.y < p2.y) {
                        // edge goes down
                        path += ` L ${p.x},${p.y-3}`;
                    } else {
                        // edge goes up
                        path += ` L ${p.x},${p.y + 3}`;
                    }
                } else {
                    // edge goes left or right
                    if (p1.x < p2.x) {
                        // edge goes right
                        path += ` L ${p.x - 3},${p.y}`;
                    } else {
                        // edge goes left
                        path += ` L ${p.x + 3},${p.y}`;
                    }
                }
            } else {
                path += ` L ${p.x},${p.y}`;
            }
        }

        // if an STPANode is selected, the components not connected to it should fade out
        const hidden = (edge.type === STPA_EDGE_TYPE || edge.type === STPA_INTERMEDIATE_EDGE_TYPE) && highlighting && !(edge as STPAEdge).highlight;
        // feedback edges in the control structure are possibly styled differently
        const feedbackEdge = (edge.type === CS_EDGE_TYPE || edge.type === CS_INTERMEDIATE_EDGE_TYPE) && (edge as CSEdge).edgeType === EdgeType.FEEDBACK;
        // edges that represent missing edges should be highlighted
        const missing = (edge.type === CS_EDGE_TYPE || edge.type === CS_INTERMEDIATE_EDGE_TYPE) && (edge as CSEdge).edgeType === EdgeType.MISSING_FEEDBACK;

        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption);
        const printEdge = colorStyle === "black & white";
        const coloredEdge = colorStyle === "colorful";
        const lessColoredEdge = colorStyle === "fewer colors";
        // coloring of the edge depends on the aspect
        let aspect: number = -1;
        // renderings for all junction points
        let junctionPointRenderings: VNode[] = [];
        if (edge.type === STPA_EDGE_TYPE || edge.type === STPA_INTERMEDIATE_EDGE_TYPE) {
            aspect = (edge as STPAEdge).aspect % 2 === 0 || !lessColoredEdge ? (edge as STPAEdge).aspect : (edge as STPAEdge).aspect - 1;
            junctionPointRenderings = (edge as STPAEdge).junctionPoints?.map(junctionPoint =>
                renderEllipse(junctionPoint.x, junctionPoint.y, 4, 4, 1)
            ) ?? [];
        }
        const feedbackStyle = this.renderOptionsRegistry.getValue(FeedbackStyleOption);
        const dotted = feedbackStyle === dottedFeedback;
        const greyFeedback = feedbackStyle === lightGreyFeedback;
        return <g class-print-edge={printEdge} class-stpa-edge={coloredEdge || lessColoredEdge}
        class-feedback-dotted={feedbackEdge && dotted} class-feedback-grey={feedbackEdge && greyFeedback} class-missing-edge={missing} class-greyed-out={hidden} aspect={aspect}>
        <path d={path} />
            {...(junctionPointRenderings ?? [])}
            </g>;
    }

    protected renderAdditionals(edge: SEdgeImpl, segments: Point[], context: RenderingContext): VNode[] {
        // if an STPANode is selected, the components not connected to it should fade out
        const hidden = edge.type === STPA_EDGE_TYPE && highlighting && !(edge as STPAEdge).highlight;

        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        let endpoint: string;
        // determine the last point to draw the arrow correctly (not reaching into the target node)
        if (p1.x === p2.x) {
            // edge goes down or up
            if (p1.y < p2.y) {
                // edge goes down
                endpoint = `${p2.x} ${p2.y-2}`;
            } else {
                // edge goes up
                endpoint = `${p2.x} ${p2.y + 2}`;
            }
        } else {
            // edge goes left or right
            if (p1.x < p2.x) {
                // edge goes right
                endpoint = `${p2.x - 2} ${p2.y}`;
            } else {
                // edge goes left
                endpoint = `${p2.x + 2} ${p2.y}`;
            }
        }


        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption);
        const printEdge = colorStyle === "black & white";
        const coloredEdge = colorStyle === "colorful" && edge.type !== CS_EDGE_TYPE;
        const sprottyEdge = colorStyle === "standard" || (edge.type === CS_EDGE_TYPE && !printEdge);
        const lessColoredEdge = colorStyle === "fewer colors";
        let aspect: number = -1;
        if (edge.type === STPA_EDGE_TYPE || edge.type === STPA_INTERMEDIATE_EDGE_TYPE) {
            aspect = (edge as STPAEdge).aspect % 2 === 0 || !lessColoredEdge ? (edge as STPAEdge).aspect : (edge as STPAEdge).aspect - 1;
        }
        // edges that represent missing edges should be highlighted
        const missing = (edge.type === CS_EDGE_TYPE || edge.type === CS_INTERMEDIATE_EDGE_TYPE) && (edge as CSEdge).edgeType === EdgeType.MISSING_FEEDBACK;

        // feedback edges in the control structure are possibly styled differently
        const feedbackEdge = (edge.type === CS_EDGE_TYPE || edge.type === CS_INTERMEDIATE_EDGE_TYPE) && (edge as CSEdge).edgeType === EdgeType.FEEDBACK;
        const feedbackStyle = this.renderOptionsRegistry.getValue(FeedbackStyleOption);
        const greyFeedback = feedbackStyle === lightGreyFeedback;
        return [
            <path  class-missing-edge-arrow={missing} class-print-edge-arrow={printEdge} class-stpa-edge-arrow={coloredEdge || lessColoredEdge} class-greyed-out={hidden} aspect={aspect}
                class-feedback-grey-arrow={feedbackEdge && greyFeedback}    
                class-sprotty-edge-arrow={sprottyEdge} d="M 6,-3 L 0,0 L 6,3 Z"
                transform={`rotate(${this.angle(p2, p1)} ${endpoint}) translate(${endpoint})`} />
        ];
    }

    angle(x0: Point, x1: Point): number {
        return toDegrees(Math.atan2(x1.y - x0.y, x1.x - x0.x));
    }
}

@injectable()
export class IntermediateEdgeView extends PolylineArrowEdgeView {

    protected renderAdditionals(edge: SEdgeImpl, segments: Point[], context: RenderingContext): VNode[] {
        // const p = segments[segments.length - 1];
        // return [
        //     <path d="M 0 0 L 0 3 M 5 3 L -5 3"
        //         transform={` translate(${p.x} ${p.y})`} />
        // ];
        return [];
    }
}

@injectable()
export class STPANodeView extends RectangularNodeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry;

    render(node: STPANode, context: RenderingContext): VNode {

        // determines the color of the node
        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption);
        const printNode = colorStyle === "black & white";
        const coloredNode = colorStyle === "colorful";
        const sprottyNode = colorStyle === "standard";
        const lessColoredNode = colorStyle === "fewer colors";
        const aspect = node.aspect % 2 === 0 || !lessColoredNode ? node.aspect : node.aspect - 1;

        // create the element based on the option and the aspect of the node
        let element: VNode;
        if (this.renderOptionsRegistry.getValue(DifferentFormsOption)) {
            switch (node.aspect) {
                case STPAAspect.LOSS:
                    element = renderTrapez(node);
                    break;
                case STPAAspect.HAZARD:
                    element = renderRectangle(node);
                    break;
                case STPAAspect.SYSTEMCONSTRAINT:
                    element = renderHexagon(node);
                    break;
                case STPAAspect.RESPONSIBILITY:
                    element = renderPentagon(node);
                    break;
                case STPAAspect.UCA:
                    element = renderOval(node);
                    break;
                case STPAAspect.CONTROLLERCONSTRAINT:
                    element = renderMirroredTriangle(node);
                    break;
                case STPAAspect.SCENARIO:
                    element = renderTriangle(node);
                    break;
                case STPAAspect.SAFETYREQUIREMENT:
                    element = renderDiamond(node);
                    break;
                default:
                    element = renderRectangle(node);
                    break;
            }
        } else if (lessColoredNode) {
            // aspects with same color should have different forms
            switch (node.aspect) {
                case STPAAspect.LOSS:
                case STPAAspect.SYSTEMCONSTRAINT:
                case STPAAspect.UCA:
                case STPAAspect.SCENARIO:
                    element = renderRectangle(node);
                    break;
                case STPAAspect.HAZARD:
                case STPAAspect.RESPONSIBILITY:
                case STPAAspect.CONTROLLERCONSTRAINT:
                case STPAAspect.SAFETYREQUIREMENT:
                    element = renderRoundedRectangle(node);
                    break;
                default:
                    element = renderRectangle(node);
                    break;
            }
        } else {
            element = renderRectangle(node);
        }

        // if an STPANode is selected, the components not connected to it should fade out
        const hidden = highlighting && !node.highlight;

        return <g
            class-print-node={printNode}
            class-stpa-node={coloredNode || lessColoredNode} aspect={aspect}
            class-sprotty-node={sprottyNode}
            class-sprotty-port={node instanceof SPortImpl}
            class-mouseover={node.hoverFeedback}
            class-greyed-out={hidden}>
            <g class-node-selected={node.selected}>{element}</g>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class CSNodeView extends RectangularNodeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry;

    render(node: SNodeImpl, context: RenderingContext): VNode {
        const colorStyle = this.renderOptionsRegistry.getValue(ColorStyleOption);
        const sprottyNode = colorStyle === "standard";
        const printNode = !sprottyNode;
        const missingFeedback = node.type === CS_NODE_TYPE && (node as CSNode).hasMissingFeedback;
        const rectangle = <rect 
                class-missing-feedback-node={missingFeedback} class-print-node={printNode}
                class-sprotty-node={sprottyNode} class-sprotty-port={node instanceof SPortImpl}
                class-mouseover={node.hoverFeedback} class-selected={node.selected}
                x="0" y="0" width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}
            > </rect>;
        if (node.type === CS_NODE_TYPE && (node as CSNode).hasChildren) {
            // render the expand/collapse icon indicating that the node can be expanded
            const icon = (node as CSNode).expanded ? renderCollapseIcon() : renderExpandIcon();
            return <g>
                {icon}
                {rectangle}
                {context.renderChildren(node)}
            </g>;
        } else {
            return <g>
                {rectangle}
                {context.renderChildren(node)}
            </g>;
        }
    }
}

@injectable()
export class InvisibleNodeView extends RectangularNodeView {

    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry;

    render(node: SNodeImpl, context: RenderingContext): VNode {
        return <g>
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class STPAGraphView extends SGraphView {

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;

    render(model: Readonly<SGraphImpl>, context: RenderingContext): VNode {
        // to render the snippet panel the modelrenderer and the canvasbounds are needed
        this.actionDispatcher.dispatch(SendModelRendererAction.create(context as ModelRenderer, model.canvasBounds));
        const allNodes: SNodeImpl[] = [];
        collectAllChildren(model.children as SNodeImpl[], allNodes);
        highlighting = allNodes.find(node => {
            return node instanceof STPANode && node.highlight;
        }) !== undefined;

        return super.render(model, context);
    }

}

@injectable()
export class PortView implements IView {
    render(model: SPortImpl, context: RenderingContext): VNode {
        const port = <g>{renderPort(model.position.x, model.position.y, model.size.width, model.size.height)}</g>;
        return <g class-pasta-hidden>{port}</g>;
    }
}

export function renderPort(x:number, y: number, width: number, height: number): VNode {
    return <rect
        x={x} y={y}
        width={Math.max(width, 0)} height={Math.max(height, 0)}
    />;
}

@injectable()
export class HeaderLabelView extends SLabelView {
    render(label: Readonly<SLabelImpl>, context: RenderingContext): VNode | undefined {
        return <g class-header={true}>
            {super.render(label, context)}
        </g>;
    }
}

@injectable()
export class EdgeLabelView extends SLabelView {
    // TODO: background for the labels to be better readable
    render(label: Readonly<SLabelImpl>, context: RenderingContext): VNode | undefined {
        // label belongs to a node which may have missing feedback
        const nodeMissingFeedback = label.parent.type === CS_NODE_TYPE && (label.parent as CSNode).hasMissingFeedback;
        // label belongs to an edge which may be a missing feedback edge
        const edgeMissingFeedback = (label.parent.type === CS_EDGE_TYPE || label.parent.type === CS_INTERMEDIATE_EDGE_TYPE) && (label.parent as CSEdge).edgeType === EdgeType.MISSING_FEEDBACK;
        const missingFeedbackLabel = nodeMissingFeedback || edgeMissingFeedback;

        const vnode = super.render(label, context);
        if (vnode?.data?.class) {
            vnode.data.class['missing-feedback-label'] = missingFeedbackLabel ?? false;
        }

        return vnode;
    }
}

