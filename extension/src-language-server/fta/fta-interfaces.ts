import { SEdge, SNode } from "sprotty-protocol";
import { FTAAspect } from "./fta-model";


/**
 * Node representing a FTA component.
 */
export interface FTANode extends SNode{
    aspect: FTAAspect,
    description: string
    highlight?: boolean
    level?: number
    k?: number
    n?: number

}

/**
 * Edge representing an edge in the relationship graph.
 */
export interface FTAEdge extends SEdge {
    highlight?: boolean
}