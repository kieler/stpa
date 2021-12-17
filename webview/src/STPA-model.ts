import { SNode, SEdge, connectableFeature, selectFeature, layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature } from "sprotty";

export const STPA_NODE_TYPE = 'node:stpa'
export const PARENT_TYPE= 'node:parent'
export const CS_NODE_TYPE = 'node:cs'
export const EDGE_TYPE = 'edge'
export const CS_EDGE_TYPE = 'edge:controlStructure'

export class STPANode extends SNode {
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];

    aspect: STPAAspect = STPAAspect.UNDEFINED
    description: string = ""
}

export class CSNode extends SNode {
    layer?: number
    // processmodel?
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];
}

export class CSEdge extends SEdge {
    direction: EdgeDirection = EdgeDirection.UNDEFINED
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