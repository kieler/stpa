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
import { Point, PolylineEdgeView, RectangularNodeView, RenderingContext, SEdge, SNode, svg } from 'sprotty';
import { DISymbol } from "./di.symbols";
import { FTAEdge, FTANode, FTA_EDGE_TYPE, FTNodeType } from './fta-model';
import { CutSetsRegistry } from './options/cut-set-registry';
import { renderAndGate, renderCircle, renderInhibitGate, renderKnGate, renderOrGate, renderRectangle } from "./views-rendering";


@injectable()
export class PolylineArrowEdgeViewFTA extends PolylineEdgeView {

    protected renderLine(edge: SEdge, segments: Point[], context: RenderingContext): VNode {
        const firstPoint = segments[0];
        let path = `M ${firstPoint.x},${firstPoint.y}`;
        for (let i = 1; i < segments.length; i++) {
            const p = segments[i];
            path += ` L ${p.x},${p.y}`;
        }

        if((edge.target as FTANode).highlight === true){
            (edge as FTAEdge).highlight = true;
        }else{
            (edge as FTAEdge).highlight = false;
        }

        // if an FTANode is selected, the components not connected to it should fade out
        const hidden = edge.type == FTA_EDGE_TYPE && !(edge as FTAEdge).highlight;
 
        return <path class-fta-edge={true} class-fta-hidden={hidden} d={path} />;
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

        //highlight every node that is in the selected cut set or on the path to the top event.
        let set = this.cutSetsRegistry.getCurrentValue();
        let bool = false;
        if(set !== undefined){
            //highlight all when the empty cut set is selected
            if(set === '-' ){
                node.highlight = true;
            }else{
                //unhighlight every node first and then only highlight the correct ones.
                node.highlight = false;
                if(node.nodeType === FTNodeType.COMPONENT || node.nodeType === FTNodeType.CONDITION){
                    //node is component or condition and in the selected cut set.
                    if(set.includes(node.id)){
                        node.highlight = true;
                        bool = true;

                    }else{
                        //all other components and conditions are not highlighted.
                        node.highlight = false;   
                        bool= false;
                    }
                }else{
                    //check if a gate should be highlighted
                    if(this.checkIfHighlighted(node, set) === true){
                        node.highlight = true;
                    }else{
                        node.highlight = false;
                    }
                }
            }            
        }

        //if an FTANode is selected, the components not connected to it should fade out
        const hidden = !node.highlight;

        return <g
            class-fta-node={true}
            class-mouseover={node.hoverFeedback}
            class-fta-hidden={hidden}
            class-fta-highlight-node={bool}>
            <g class-node-selected={node.selected}>{element}</g>
            {context.renderChildren(node)}
        </g>;
    }

    /**
     * Takes a node and checks if it is connected to a highlighted node.
     * @param node The node we want to check.
     * @param set The set of all highlighted nodes.
     * @returns True if the node is connected to a node from the set or false otherwise.
     */
    checkIfHighlighted(node: FTANode, set: any):boolean{
        for(const edge of node.outgoingEdges){
            let target = (edge.target as FTANode);
            if((target.nodeType === FTNodeType.COMPONENT || target.nodeType === FTNodeType.CONDITION)){
                if(set.includes(target.id)){
                    return true;
                }
            }else{
                if(this.checkIfHighlighted(target, set) === true){
                    return true;
                }
            }
        }
        return false;
    }
}

@injectable()
export class FTAGraphView extends RectangularNodeView{


    render(node: SNode, context: RenderingContext): VNode {

        return <g>
            <rect
                class-print-node={true}
                class-mouseover={node.hoverFeedback}
                x="0" y="0" width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}
            > </rect>
            {context.renderChildren(node)}
        </g>;
    }
}