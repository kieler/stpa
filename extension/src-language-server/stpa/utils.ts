/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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
    Command,
    ContConstraint,
    Context,
    Graph,
    Hazard,
    HazardList,
    Loss,
    LossScenario,
    Node,
    Responsibility,
    Rule,
    SafetyConstraint,
    SystemConstraint,
    UCA,
    Variable,
    isContConstraint,
    isContext,
    isHazard,
    isLoss,
    isLossScenario,
    isResponsibility,
    isSafetyConstraint,
    isSystemConstraint,
    isUCA
} from "../generated/ast";
import { STPANode } from "./stpa-interfaces";
import { STPAAspect } from "./stpa-model";
import { groupValue } from "./synthesis-options";


export type leafElement = Loss | Hazard | SystemConstraint | Responsibility | UCA | ContConstraint | LossScenario | SafetyConstraint | Context;
export type elementWithName = Loss | Hazard | SystemConstraint | Responsibility | UCA | ContConstraint | LossScenario | SafetyConstraint | Node | Variable | Graph | Command | Context | Rule;
export type elementWithRefs = Hazard | SystemConstraint | Responsibility | HazardList | ContConstraint | SafetyConstraint;

/**
 * Returns the control actions defined in the file given by the {@code uri}.
 * @param uri Uri of the file which control actions should be returned.
 * @param shared The shared services of Langium.
 * @returns the control actions that are defined in the file determined by the {@code uri}.
 */
export function getControlActions(uri: string, shared: LangiumSprottySharedServices | LangiumSharedServices): Record<string, string[]> {
    const controlActionsMap: Record<string, string[]> = {};
    // get the model from the file determined by the uri
    const model = getModel(uri, shared);
    // collect control actions grouped by their controller
    model.controlStructure?.nodes.forEach(systemComponent => {
        systemComponent.actions.forEach(action => {
            action.comms.forEach(command => {
                const actionList = controlActionsMap[systemComponent.name];
                if (actionList !== undefined) {
                    actionList.push(command.name);
                } else {
                    controlActionsMap[systemComponent.name] = [command.name];
                }
            });
        });
    });
    return controlActionsMap;
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
    } else if (isUCA(node) || isContext(node)) {
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