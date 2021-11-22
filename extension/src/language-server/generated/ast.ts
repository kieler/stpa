/******************************************************************************
 * This file was generated by langium-cli 0.2.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { AstNode, AstReflection, Reference, isAstNode } from 'langium';

export interface CommandUCAs extends AstNode {
    readonly $container: Model;
    name: string
    ucas: Array<UCA>
}

export const CommandUCAs = 'CommandUCAs';

export function isCommandUCAs(item: unknown): item is CommandUCAs {
    return reflection.isInstance(item, CommandUCAs);
}

export interface ContConstraints extends AstNode {
    readonly $container: Model;
    description: string
    name: string
    ucas: Array<Reference<UCA>>
}

export const ContConstraints = 'ContConstraints';

export function isContConstraints(item: unknown): item is ContConstraints {
    return reflection.isInstance(item, ContConstraints);
}

export interface Edge extends AstNode {
    readonly $container: Graph;
    label: string
    name: string
    source: Reference<Node>
    target: Reference<Node>
}

export const Edge = 'Edge';

export function isEdge(item: unknown): item is Edge {
    return reflection.isInstance(item, Edge);
}

export interface Graph extends AstNode {
    readonly $container: Model | Node;
    edges: Array<Edge>
    systems: Array<Node>
}

export const Graph = 'Graph';

export function isGraph(item: unknown): item is Graph {
    return reflection.isInstance(item, Graph);
}

export interface Hazard extends AstNode {
    readonly $container: Model;
    description: string
    losses: Array<Reference<Loss>>
    name: string
}

export const Hazard = 'Hazard';

export function isHazard(item: unknown): item is Hazard {
    return reflection.isInstance(item, Hazard);
}

export interface Loss extends AstNode {
    readonly $container: Model;
    description: string
    name: string
}

export const Loss = 'Loss';

export function isLoss(item: unknown): item is Loss {
    return reflection.isInstance(item, Loss);
}

export interface Model extends AstNode {
    allUCAs: Array<CommandUCAs>
    controllerConstraints: Array<ContConstraints>
    controlStructure: Graph
    hazards: Array<Hazard>
    losses: Array<Loss>
    responsibilities: Array<Responsibility>
    systemLevelConstraints: Array<SystemConstraint>
}

export const Model = 'Model';

export function isModel(item: unknown): item is Model {
    return reflection.isInstance(item, Model);
}

export interface Node extends AstNode {
    readonly $container: Graph;
    actions: Array<VerticalEdge>
    feedbacks: Array<VerticalEdge>
    name: string
    subsystem: Array<Graph>
    variables: Array<Variable>
}

export const Node = 'Node';

export function isNode(item: unknown): item is Node {
    return reflection.isInstance(item, Node);
}

export interface Responsibility extends AstNode {
    readonly $container: Model;
    description: string
    name: string
    systemConstraints: Array<Reference<SystemConstraint>>
}

export const Responsibility = 'Responsibility';

export function isResponsibility(item: unknown): item is Responsibility {
    return reflection.isInstance(item, Responsibility);
}

export interface SystemConstraint extends AstNode {
    readonly $container: Model;
    description: string
    hazard: Reference<Hazard>
    name: string
}

export const SystemConstraint = 'SystemConstraint';

export function isSystemConstraint(item: unknown): item is SystemConstraint {
    return reflection.isInstance(item, SystemConstraint);
}

export interface UCA extends AstNode {
    readonly $container: CommandUCAs;
    description: string
    hazards: Array<Reference<Hazard>>
    name: string
}

export const UCA = 'UCA';

export function isUCA(item: unknown): item is UCA {
    return reflection.isInstance(item, UCA);
}

export interface Variable extends AstNode {
    readonly $container: Node;
    name: string
    values: Array<string>
}

export const Variable = 'Variable';

export function isVariable(item: unknown): item is Variable {
    return reflection.isInstance(item, Variable);
}

export interface VerticalEdge extends AstNode {
    readonly $container: Node;
    name: string
    target: Reference<Node>
}

export const VerticalEdge = 'VerticalEdge';

export function isVerticalEdge(item: unknown): item is VerticalEdge {
    return reflection.isInstance(item, VerticalEdge);
}

export type StpaAstType = 'CommandUCAs' | 'ContConstraints' | 'Edge' | 'Graph' | 'Hazard' | 'Loss' | 'Model' | 'Node' | 'Responsibility' | 'SystemConstraint' | 'UCA' | 'Variable' | 'VerticalEdge';

export type StpaAstReference = 'ContConstraints:ucas' | 'Edge:source' | 'Edge:target' | 'Hazard:losses' | 'Responsibility:systemConstraints' | 'SystemConstraint:hazard' | 'UCA:hazards' | 'VerticalEdge:target';

export class StpaAstReflection implements AstReflection {

    getAllTypes(): string[] {
        return ['CommandUCAs', 'ContConstraints', 'Edge', 'Graph', 'Hazard', 'Loss', 'Model', 'Node', 'Responsibility', 'SystemConstraint', 'UCA', 'Variable', 'VerticalEdge'];
    }

    isInstance(node: unknown, type: string): boolean {
        return isAstNode(node) && this.isSubtype(node.$type, type);
    }

    isSubtype(subtype: string, supertype: string): boolean {
        if (subtype === supertype) {
            return true;
        }
        switch (subtype) {
            default: {
                return false;
            }
        }
    }

    getReferenceType(referenceId: StpaAstReference): string {
        switch (referenceId) {
            case 'ContConstraints:ucas': {
                return UCA;
            }
            case 'Edge:source': {
                return Node;
            }
            case 'Edge:target': {
                return Node;
            }
            case 'Hazard:losses': {
                return Loss;
            }
            case 'Responsibility:systemConstraints': {
                return SystemConstraint;
            }
            case 'SystemConstraint:hazard': {
                return Hazard;
            }
            case 'UCA:hazards': {
                return Hazard;
            }
            case 'VerticalEdge:target': {
                return Node;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }
}

export const reflection = new StpaAstReflection();
