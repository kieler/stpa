import { SEdge, SNode, connectableFeature, fadeFeature, hoverFeedbackFeature, layoutContainerFeature, popupFeature, selectFeature } from "sprotty";


// The types of diagram elements
export const FTA_NODE_TYPE = 'node:fta';
export const PARENT_TYPE = 'node:parent';
export const EDGE_TYPE = 'edge';
export const FTA_EDGE_TYPE = 'edge:fta';



/**
 * Node representing a FTA component.
 */
export class FTANode extends SNode{
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];

    aspect: FTAAspect = FTAAspect.UNDEFINED;
    description: string = "";
    highlight?: boolean;
    level?: number;
    k?: number;
    n?: number;

}

/**
 * Edge representing an edge in the relationship graph.
 */
export class FTAEdge extends SEdge {
    highlight?: boolean;
}


/**
 * The different aspects of FTA.
 */
export enum FTAAspect {
    TOPEVENT,
    COMPONENT,
    CONDITION,
    AND,
    OR,
    KN,
    INHIBIT,
    UNDEFINED
}


/**
 * Node representing a system component in the BDD.
 */
export class BDDNode extends SNode {
    level?: number;
    static readonly DEFAULT_FEATURES = [connectableFeature, selectFeature,
        layoutContainerFeature, fadeFeature, hoverFeedbackFeature, popupFeature];
}

/**
 * Edge representing component failure in the BDD.
 */
export class BDDEdge extends SEdge {
    fail?: boolean;
}