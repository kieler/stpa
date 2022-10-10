/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { AstNode } from "langium";
import {
    isHazard, isResponsibility, isSystemConstraint, isContConstraint, isSafetyConstraint, isUCA, isLossScenario,
    isLoss, Hazard, SystemConstraint
} from "./generated/ast";
import { STPAAspect } from "./stpa-model";
import { STPANode } from "./stpa-interfaces";

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
 * Getter for the references contained in {@code node}.
 * @param node The STPAAspect which tracings should be returned.
 * @returns The objects {@code node} is traceable to.
 */
export function getTargets(node: AstNode, hierarchy: boolean): AstNode[] {
    if (node) {
        if (isHazard(node) || isResponsibility(node) || isSystemConstraint(node) || isContConstraint(node)) {
            const targets: AstNode[] = [];
            for (const ref of node.refs) {
                if (ref?.ref) { targets.push(ref.ref); }
            }
            // for subcomponents the parents must be declared as targets too, if hierarchy is false
            if (!hierarchy && ((isHazard(node) && isHazard(node.$container)) || (isSystemConstraint(node) && isSystemConstraint(node.$container)))) {
                targets.push(node.$container);
            }
            return targets;
        } else if (isSafetyConstraint(node)) {
            const targets = [];
            if (node.refs.ref) { targets.push(node.refs.ref); }
            return targets;
        } else if (isLossScenario(node) && node.uca && node.uca.ref) {
            return [node.uca.ref];
        } else if ((isUCA(node) || isLossScenario(node)) && node.list) {
            const refs = node.list.refs.map(x => x.ref);
            const targets = [];
            for (const ref of refs) {
                if (ref) { targets.push(ref); }
            }
            return targets;
        } else {
            return [];
        }
    } else {
        return [];
    }
}

/**
 * Getter for the aspect of a STPA component.
 * @param node AstNode which aspect should determined.
 * @returns the aspect of {@code node}.
 */
export function getAspect(node: AstNode): STPAAspect {
    if (isLoss(node)) {
        return STPAAspect.LOSS;
    } else if (isHazard(node)) {
        return STPAAspect.HAZARD;
    } else if (isSystemConstraint(node)) {
        return STPAAspect.SYSTEMCONSTRAINT;
    } else if (isUCA(node)) {
        return STPAAspect.UCA;
    } else if (isResponsibility(node)) {
        return STPAAspect.RESPONSIBILITY;
    } else if (isContConstraint(node)) {
        return STPAAspect.CONTROLLERCONSTRAINT;
    } else if (isLossScenario(node)) {
        return STPAAspect.SCENARIO;
    } else if (isSafetyConstraint(node)) {
        return STPAAspect.SAFETYREQUIREMENT;
    }
    return STPAAspect.UNDEFINED;
}

/**
 * Collects the {@code topElements}, their children, their children's children and so on.
 * @param topElements The top elements that possbible have children.
 * @returns A list with the given {@code topElements} and their descendants.
 */
export function collectElementsWithSubComps(topElements: (Hazard | SystemConstraint)[]): AstNode[] {
    let result = topElements;
    let todo = topElements;
    for (let i = 0; i < todo.length; i++) {
        let current = todo[i];
        if (current.subComps) {
            result = result.concat(current.subComps);
            todo = todo.concat(current.subComps);
        }
    }
    return result;
}

/**
 * Determines the layer {@code node} should be in depending on the STPA aspect it represents.
 * @param node STPANode for which the layer should be determined.
 * @param hazardDepth Maximal depth of the hazard hierarchy.
 * @param sysConsDepth Maximal depth of the system-level constraint hierarchy.
 * @param map Maps control actions to group number.
 * @returns The number of the layer {@code node} should be in.
 */
function determineLayerForSTPANode(node: STPANode, hazardDepth: number, sysConsDepth: number, map: Map<string, number>, groupUCAs: boolean): number {
    switch (node.aspect) {
        case STPAAspect.LOSS:
            return 0;
        case STPAAspect.HAZARD:
            return 1 + node.hierarchyLvl;
        case STPAAspect.SYSTEMCONSTRAINT:
            return 2 + hazardDepth + node.hierarchyLvl;
        case STPAAspect.RESPONSIBILITY:
            return 3 + hazardDepth + sysConsDepth;
        case STPAAspect.UCA:
            if (groupUCAs) {
                if (node.controlAction && !map.has(node.controlAction)) {
                    map.set(node.controlAction, map.size)
                }
                return 4 + hazardDepth + sysConsDepth + map.get(node.controlAction!)!;
            }
            return 4 + hazardDepth + sysConsDepth;
        case STPAAspect.CONTROLLERCONSTRAINT:
            return 5 + hazardDepth + sysConsDepth + map.size;
        case STPAAspect.SCENARIO:
            return 6 + hazardDepth + sysConsDepth + map.size;
        case STPAAspect.SAFETYREQUIREMENT:
            return 7 + hazardDepth + sysConsDepth + map.size;
        default:
            return -1;
    }
}

/**
 * Sets the level property for {@code nodes} depending on the layer they should be in.
 * @param nodes The nodes representing the stpa components.
 */
export function setLevelsForSTPANodes(nodes: STPANode[], groupUCAs: boolean): void {
    // determines the maximal hierarchy depth of hazards and system constraints
    let maxHazardDepth = -1;
    let maxSysConsDepth = -1;
    for (const node of nodes) {
        if (node.aspect === STPAAspect.HAZARD) {
            maxHazardDepth = maxHazardDepth > node.hierarchyLvl ? maxHazardDepth : node.hierarchyLvl;
        }
        if (node.aspect === STPAAspect.SYSTEMCONSTRAINT) {
            maxSysConsDepth = maxSysConsDepth > node.hierarchyLvl ? maxSysConsDepth : node.hierarchyLvl;
        }
    }

    let map = new Map<string, number>()
    // sets level property to the layer of the nodes.
    for (const node of nodes) {
        const layer = determineLayerForSTPANode(node, maxHazardDepth, maxSysConsDepth, map, groupUCAs);
        node.level = -layer;
    }
}

