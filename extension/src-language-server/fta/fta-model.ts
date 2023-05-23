
//diagram elements
export const FTA_NODE_TYPE = 'node:fta';
export const PARENT_TYPE= 'node:parent';
export const EDGE_TYPE = 'edge';
export const FTA_EDGE_TYPE = 'edge:fta';


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