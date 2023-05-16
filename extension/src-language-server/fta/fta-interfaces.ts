import { SNode, SEdge } from "sprotty-protocol";
import{FTAAspect} from "./fta-model";
import { Condition } from "../generated/ast";


/**
 * Node representing a FTA component.
 */
export interface FTANode extends SNode{
    aspect: FTAAspect,
    description: string
    highlight?: boolean
    level?: number

}

/**
 * Edge representing an edge in the relationship graph.
 */
export interface FTAEdge extends SEdge {
    highlight?: boolean
}