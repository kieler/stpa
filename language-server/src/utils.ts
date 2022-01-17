import { AstNode } from "langium";
import { isHazard, isResponsibility, isSystemConstraint, isContConstraint, isSafetyConstraint, isUCA, isLossScenario, isLoss } from "./generated/ast"
import { STPAAspect } from "./STPA-model"
import { STPANode, CSNode } from "./STPA-interfaces";

/**
 * Determines the layer {@code node} should be in depending on the STPA aspect it represents.
 * @param node STPANode for which the layer should be determined.
 * @returns The number of the layer the node should be in.
 */
export function determineLayerForSTPANode(node: STPANode): number {
    switch(node.aspect) {
        case STPAAspect.LOSS: 
            return 0
        case STPAAspect.HAZARD:
            if (node.subcomp) {
                return 1.5
            }
            return 1
        case STPAAspect.SYSTEMCONSTRAINT:
            if (node.subcomp) {
                return 2.5
            }
            return 2
        case STPAAspect.RESPONSIBILITY:
            return 3
        case STPAAspect.UCA:
            return 4
        case STPAAspect.CONTROLLERCONSTRAINT:
            return 5
        case STPAAspect.SCENARIO:
            return 6
        case STPAAspect.SAFETYREQUIREMENT:
            return 7
        default:
            return -1
    }
}

/**
 * Determines the layer for each node and sets their layer attribute.
 * Thereby, the nodes without control actions are at the bottom/last layer.
 * @param nodes All nodes of the control structure.
 */
export function determineLayerForCSNodes(nodes: CSNode[]): void {
    /* let layer = nodes.length
    let sinks: CSNode[] = []
    while (true) {
        for (let n of nodes) {
            let s = true
            for (let edge of n.outgoingEdges) {
                if (edge instanceof CSEdge && edge.direction == EdgeDirection.DOWN && edge.target instanceof CSNode && !edge.target.layer) {
                    s = false
                }
            }
            if (s) {
                sinks.push(n)
                break;
            }
        }
        if (sinks.length == 0) {
            break;
        }

        for (let s of sinks) {
            s.layer = layer
        }
        layer--
        sinks = []
    } */
}

/**
 * Getter for the tracing of {@code node}.
 * @param node The STPAAspect which tracings should be returned.
 * @returns The objects {@code node} is traceable to.
 */
export function getTargets(node: AstNode): AstNode[] {
    if (node) {
        if (isHazard(node) || isResponsibility(node) || isSystemConstraint(node) || isContConstraint(node)) { 
            const targets: AstNode[] = []
            for (const ref of node.refs) {
                if (ref?.ref) targets.push(ref.ref)
            }
            if ((isHazard(node) && isHazard(node.$container)) || (isSystemConstraint(node) && isSystemConstraint(node.$container))) {
                targets.push(node.$container)
            }
            return targets
        } else if (isSafetyConstraint(node)) {
            const targets = []
            if (node.refs.ref) targets.push(node.refs.ref)
            return targets
        } else if (isLossScenario(node) && node.uca && node.uca.ref) {
            return [node.uca.ref]
        } else if ((isUCA(node) || isLossScenario(node)) && node.list) {
            const refs = node.list.refs.map(x => x.ref)
            const targets = []
            for (const ref of refs) {
                if (ref) targets.push(ref)
            }
            return targets
        } else {
            return []
        }
    } else {
        return []
    }
}

/**
 * Getter for the aspect of a STPA component
 * @param node AstNode, which aspect should determined
 * @returns the aspect of {@code node}
 */
export function getAspect(node: AstNode): STPAAspect {
    if (isLoss(node)) {
        return STPAAspect.LOSS
    } else if (isHazard(node)) {
        return STPAAspect.HAZARD
    } else if (isSystemConstraint(node)) {
        return STPAAspect.SYSTEMCONSTRAINT
    } else if (isUCA(node)) {
        return STPAAspect.UCA
    } else if (isResponsibility(node)) {
        return STPAAspect.RESPONSIBILITY
    } else if (isContConstraint(node)) {
        return STPAAspect.CONTROLLERCONSTRAINT
    } else if (isLossScenario(node)) {
        return STPAAspect.SCENARIO
    } else if (isSafetyConstraint(node)) {
        return STPAAspect.SAFETYREQUIREMENT
    }
    return STPAAspect.UNDEFINED
}