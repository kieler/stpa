import { AstNode } from "langium";
import { isHazard, isResponsibility, isSystemConstraint, isContConstraint, isSafetyConstraint, isUCA, isLossScenario, 
    isLoss, Hazard, SystemConstraint } from "./generated/ast"
import { STPAAspect } from "./stpa-model"
import { CSNode, STPANode } from "./stpa-interfaces";
import { SShapeElement } from 'sprotty-protocol';

/**
 * Determines the layer for each node and sets their layer attribute.
 * Thereby, the nodes without control actions are at the bottom/last layer.
 * @param nodes All nodes of the control structure.
 */
/* export function determineLayerForCSNodes(nodes: CSNode[]): void {
    let layer = nodes.length
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
    }
} */

/**
 * Getter for the tracing of {@code node}.
 * @param node The STPAAspect which tracings should be returned.
 * @returns The objects {@code node} is traceable to.
 */
export function getTargets(node: AstNode, hierarchy: boolean): AstNode[] {
    if (node) {
        if (isHazard(node) || isResponsibility(node) || isSystemConstraint(node) || isContConstraint(node)) { 
            const targets: AstNode[] = []
            for (const ref of node.refs) {
                if (ref?.ref) targets.push(ref.ref)
            }
            if (!hierarchy && ((isHazard(node) && isHazard(node.$container)) || (isSystemConstraint(node) && isSystemConstraint(node.$container)))) {
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


/**
 * Collects the {@code topElements}, their children, their children's children and so on.
 * @param topElements The top elements that possbible have children.
 * @returns A list with the existing elements.
 */
export function collectElementsWithSubComps(topElements: (Hazard|SystemConstraint)[]): AstNode[] {
    let result = topElements
    let todo = topElements
    for (let i = 0; i < todo.length; i++) {
        let current = todo[i]
        if (current.subComps) {
            result = result.concat(current.subComps)
            todo = todo.concat(current.subComps)
        }
    }
    return result
}

/**
 * Determines the layer {@code node} should be in depending on the STPA aspect it represents.
 * @param node STPANode for which the layer should be determined.
 * @param hazardDepth Maxmal depth of the hazard hierarchy.
 * @param sysConsDepth Maximal depth of the system-level constraint hierarchy.
 * @returns The number of the layer the node should be in.
 */
function determineLayerForSTPANode(node: STPANode, hazardDepth: number, sysConsDepth: number): number {
    switch(node.aspect) {
        case STPAAspect.LOSS: 
            return 0
        case STPAAspect.HAZARD:
            return 1 + node.hierarchyLvl
        case STPAAspect.SYSTEMCONSTRAINT:
            return 2 + hazardDepth + node.hierarchyLvl
        case STPAAspect.RESPONSIBILITY:
            return 3 + hazardDepth + sysConsDepth
        case STPAAspect.UCA:
            return 4 + hazardDepth + sysConsDepth
        case STPAAspect.CONTROLLERCONSTRAINT:
            return 5 + hazardDepth + sysConsDepth
        case STPAAspect.SCENARIO:
            return 6 + hazardDepth + sysConsDepth
        case STPAAspect.SAFETYREQUIREMENT:
            return 7 + hazardDepth + sysConsDepth
        default:
            return -1
    }
}

export function setPositionsForSTPANodes(nodes: STPANode[]) {
    let maxHazardDepth = -1
    let maxSysConsDepth = -1
    for (const node of nodes) {
        if (node.aspect == STPAAspect.HAZARD) {
            maxHazardDepth = maxHazardDepth > node.hierarchyLvl ? maxHazardDepth : node.hierarchyLvl
        }
        if (node.aspect == STPAAspect.SYSTEMCONSTRAINT) {
            maxSysConsDepth = maxSysConsDepth > node.hierarchyLvl ? maxSysConsDepth : node.hierarchyLvl
        }
    }
    for (const node of nodes) {
        const layer = determineLayerForSTPANode(node, maxHazardDepth, maxSysConsDepth);
        (node as SShapeElement).position = {x: 0, y: 100 * layer}
    }
}

export function setPositionsForCSNodes(nodes: CSNode[]) {
    for (const node of nodes) {
        if (node.level) {
            (node as SShapeElement).position = {x: 0, y: 100 * node.level}
        }
    }
}
