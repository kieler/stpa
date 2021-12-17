import { AstNode } from "langium";
import { isHazard, isResponsibility, isSystemConstraint, isContConstraint, isSafetyConstraint, isUCA, isLossScenario } from "./generated/ast"
import { STPANode, STPAAspect, CSNode } from "./STPA-model"

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
            return 1
        case STPAAspect.SYSTEMCONSTRAINT:
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
                if (edge instanceof CSEdge && edge.direction == EdgeDirection.Down && edge.target instanceof CSNode && !edge.target.layer) {
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
    if (isHazard(node) || isResponsibility(node)) { 
        /* const refs = node.refs.map(x => x.ref)
        const targets = []
        for (const ref of refs) {
            if (ref) targets.push(ref)
        }
        return targets */
        return []
    } else if (isSystemConstraint(node) || isContConstraint(node) || isSafetyConstraint(node)) {
        const targets = []
        if (node.refs.ref) targets.push(node.refs.ref)
        return targets
    } else if (isUCA(node) || isLossScenario(node)) {
        const list = node.list
        const refs = list.refs.map(x => x.ref)
        const targets = []
        for (const ref of refs) {
            if (ref) targets.push(ref)
        }
        return targets
    } else {
        return []
    }
}