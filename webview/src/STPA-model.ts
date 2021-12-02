import { SNodeSchema, SNode, SEdge, SEdgeSchema, connectableFeature, selectFeature, layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature } from "sprotty";

export const STPA_NODE_TYPE = 'node:stpa'
export const PARENT_TYPE= 'node:parent'
export const CS_NODE_TYPE = 'node:cs'
export const EDGE_TYPE = 'edge'
export const CS_EDGE_TYPE = 'edge:controlStructure'

export interface STPANodeSchema extends SNodeSchema {
    aspect: STPAAspect
    description: string
}

export class STPANode extends SNode {
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];

    aspect: STPAAspect
    description: string
}

export interface CSNodeSchema extends SNodeSchema {
// processmodel??
}

export class CSNode extends SNode {
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];
}

export interface CSEdgeSchema extends SEdgeSchema {
    direction: EdgeDirection
}

export class CSEdge extends SEdge {
    direction: EdgeDirection
}

export enum STPAAspect {
    Loss,
    Hazard,
    SystemConstraint,
    Responsibility,
    UCA,
    ControllerConstraint,
    Scenario,
    SafetyRequirement
}

export enum EdgeDirection {
    Up,
    Down,
    Left,
    Right
}