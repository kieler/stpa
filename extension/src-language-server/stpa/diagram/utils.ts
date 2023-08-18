/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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
    Context,
    Hazard,
    Node,
    SystemConstraint,
    isContConstraint,
    isContext,
    isHazard,
    isLossScenario,
    isResponsibility,
    isSafetyConstraint,
    isSystemConstraint,
    isUCA
} from "../../generated/ast";
import { STPANode } from "./stpa-interfaces";
import { STPAAspect } from "./stpa-model";
import { groupValue } from "./synthesis-options";

/**
 * Getter for the references contained in {@code node}.
 * @param node The STPAAspect which tracings should be returned.
 * @param hierarchy If this is true, subcomponents are children of their parents in the diagram, otherwise the relationship is represented by edges.
 * @returns The objects {@code node} is traceable to.
 */
export function getTargets(node: AstNode, hierarchy: boolean): AstNode[] {
    if (node) {
        const targets: AstNode[] = [];
        if (isHazard(node) || isResponsibility(node) || isSystemConstraint(node) || isContConstraint(node) || isSafetyConstraint(node)) {
            for (const ref of node.refs) {
                if (ref?.ref) { targets.push(ref.ref); }
            }
            // for subcomponents the parents must be declared as targets too, if hierarchy is false
            if (!hierarchy && ((isHazard(node) && isHazard(node.$container)) || (isSystemConstraint(node) && isSystemConstraint(node.$container)))) {
                targets.push(node.$container);
            }
        } else if (isLossScenario(node) && node.uca && node.uca.ref) {
            targets.push(node.uca.ref);
        } else if ((isUCA(node) || isContext(node) || isLossScenario(node)) && node.list) {
            const refs = node.list.refs.map(x => x.ref);
            for (const ref of refs) {
                if (ref) { targets.push(ref); }
            }
        }
        return targets;
    } else {
        return [];
    }
}

/**
 * Collects the {@code topElements}, their children, their children's children and so on.
 * @param topElements The top elements that possbible have children.
 * @returns A list with the given {@code topElements} and their descendants.
 */
export function collectElementsWithSubComps(topElements: (Hazard | SystemConstraint)[]): (Hazard | SystemConstraint)[] {
    let result = topElements;
    let todo = topElements;
    for (let i = 0; i < todo.length; i++) {
        const current = todo[i];
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
 * @param groupUCAs Determines whether and how UCAs should be grouped.
 * @returns The number of the layer {@code node} should be in.
 */
function determineLayerForSTPANode(node: STPANode, hazardDepth: number, sysConsDepth: number, map: Map<string, number>, groupUCAs: groupValue): number {
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
            // each UCA group gets its own layer
            switch (groupUCAs) {
                case groupValue.CONTROL_ACTION:
                    if (node.controlAction && !map.has(node.controlAction)) {
                        map.set(node.controlAction, map.size);
                    }
                    return 4 + hazardDepth + sysConsDepth + map.get(node.controlAction!)!;
                case groupValue.SYSTEM_COMPONENT:
                    if (node.controlAction && !map.has(node.controlAction.substring(0, node.controlAction.indexOf(".")))) {
                        map.set(node.controlAction.substring(0, node.controlAction.indexOf(".")), map.size);
                    }
                    return 4 + hazardDepth + sysConsDepth + map.get(node.controlAction!.substring(0, node.controlAction!.indexOf(".")))!;
                default:
                    return 4 + hazardDepth + sysConsDepth;
            }
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
 * @param groupUCAs Determines whether and how UCAs are grouped.
 */
export function setLevelsForSTPANodes(nodes: STPANode[], groupUCAs: groupValue): void {
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

    // used to determine which control action or system component belongs to which group number
    const map = new Map<string, number>();
    // sets level property to the layer of the nodes.
    for (const node of nodes) {
        const layer = determineLayerForSTPANode(node, maxHazardDepth, maxSysConsDepth, map, groupUCAs);
        node.level = -layer;
    }
}


/**
 * Set the levels of the control structure nodes.
 * @param nodes The nodes representing the control structure.
 */
export function setLevelOfCSNodes(nodes: Node[]): void {
    const visited = new Map<string, Set<string>>();
    for (const node of nodes) {
        visited.set(node.name, new Set<string>());
    }
    nodes[0].level = 0;
    assignLevel(nodes[0], visited);
}

/**
 * Assigns the level to the connected nodes of {@code node}.
 * @param node The node for which the connected nodes should be assigned a level.
 * @param visited The edges that have been visited.
 */
function assignLevel(node: Node, visited: Map<string, Set<string>>): void {
    for (const action of node.actions) {
        const target = action.target.ref;
        if (target && !visited.get(node.name)?.has(target.name)) {
            visited.get(node.name)?.add(target.name);
            if (target.level === undefined || target.level < node.level! + 1) {
                target.level = node.level! + 1;
            }
            assignLevel(target, visited);
        }
    }
    for (const feedback of node.feedbacks) {
        const target = feedback.target.ref;
        if (target && !visited.get(node.name)?.has(target.name)) {
            visited.get(node.name)?.add(target.name);
            if (target.level === undefined || target.level > node.level! - 1) {
                target.level = node.level! - 1;
            }
            assignLevel(target, visited);
        }
    }
}

/**
 * Creates a description for the given UCA context.
 * @param uca The UCA context.
 * @returns the description of the UCA context.
 */
export function createUCAContextDescription(uca: Context): string {
    const rule = uca.$container;
    const controlAction = rule.action.$refText;
    let description = rule.system.$refText;
    switch (rule.type) {
        case 'not-provided':
            description += " did not provide " + controlAction;
            break;
        case 'provided':
            description += " provided " + controlAction;
            break;
        case 'too-late':
            description += " provided " + controlAction + " too late";
            break;
        case 'too-early':
            description += " provided " + controlAction + " too early";
            break;
        case 'wrong-time':
            description += " provided " + controlAction + " at the wrong time";
            break;
        case 'applied-too-long':
            description += " applied " + controlAction + " too long";
            break;
        case 'stopped-too-soon':
            description += " stopped " + controlAction + " too soon";
            break;
    }
    description += " in the context of ";
    for (let i = 0; i < uca.vars.length; i++) {
        description += uca.vars[i].$refText + "=" + uca.values[i];
        if (i < uca.vars.length - 1) {
            description += ", ";
        }
    }

    return description;
}