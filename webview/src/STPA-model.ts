import { SNodeSchema, selectFeature, SNode } from "sprotty";

export const NODE_TYPE = 'node'
export const EDGE_TYPE = 'edge'

export interface STPANodeSchema extends SNodeSchema {
    aspect: STPAAspect
    description: string
}

export class STPANode extends SNode {
    aspect: STPAAspect
    description: string

    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }
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