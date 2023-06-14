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

/**
 * Node representing a system component in the BDD.
 */
export interface BDDNode extends SNode {
    level?: number
}

/**
 * Edge representing component failure in the BDD.
 */
export interface BDDEdge extends SEdge {
    fail?: boolean
}