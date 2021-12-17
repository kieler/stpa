import { SNode, SEdge } from "sprotty-protocol";

export const STPA_NODE_TYPE = 'node:stpa'
export const PARENT_TYPE= 'node:parent'
export const CS_NODE_TYPE = 'node:cs'
export const EDGE_TYPE = 'edge'
export const CS_EDGE_TYPE = 'edge:controlStructure'

export interface STPANode extends SNode {

    aspect: STPAAspect
    description: string
}

export interface CSNode extends SNode {
    layer?: number
    // processmodel?
}

export interface CSEdge extends SEdge {
    direction: EdgeDirection
}

export enum STPAAspect {
    LOSS,
    HAZARD,
    SYSTEMCONSTRAINT,
    RESPONSIBILITY,
    UCA,
    CONTROLLERCONSTRAINT,
    SCENARIO,
    SAFETYREQUIREMENT,
    UNDEFINED
}

export enum EdgeDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT,
    UNDEFINED
}