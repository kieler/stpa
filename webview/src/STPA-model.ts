import { SNode, SEdge, connectableFeature, selectFeature, layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature } from "sprotty";

// The types of diagram elements
export const STPA_NODE_TYPE = 'node:stpa'
export const PARENT_TYPE= 'node:parent'
export const CS_NODE_TYPE = 'node:cs'
export const EDGE_TYPE = 'edge'
export const CS_EDGE_TYPE = 'edge:controlStructure'

/**
 * Node representing a STPA component.
 */
export class STPANode extends SNode {
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];

    aspect: STPAAspect = STPAAspect.UNDEFINED
    description: string = ""
    hierarchyLvl: number = 0
    connected?: boolean
}

/**
 * Node representing a system component in the control structure.
 */
export class CSNode extends SNode {
    level?: number
    // processmodel?
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];
}

/**
 * Edge representing control actions and feedback in the control structure.
 */
export class CSEdge extends SEdge {
    direction: EdgeDirection = EdgeDirection.UNDEFINED
}

/**
 * The different aspects of STPA.
 */
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

/**
 * Possible edge directions.
 */
export enum EdgeDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT,
    UNDEFINED
}