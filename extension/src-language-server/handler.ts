/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2023 by
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

import { LangiumSprottySharedServices } from "langium-sprotty";
import { Model } from "./generated/ast";
import { Connection, Range } from "vscode-languageserver";
import { elementWithName } from "./stpa/stpa-validator";
import { getModel } from "./utils";

/**
 * Adds handler for notifications.
 * @param connection Connection to the extension.
 * @param shared Shared services containing the workspace.
 */
export function addNotificationHandler(connection: Connection, shared: LangiumSprottySharedServices): void {
    // diagram
    connection.onNotification('diagram/selected', async (msg: {label: string, uri: string}) => {
        // get the current model
        const model = await getModel(msg.uri, shared);

        // determine the range in the editor of the component identified by "label"
        const range = getRangeOfNode(model, msg.label);
        if (range) {
            // notify extension to highlight the range in the editor
            connection.sendNotification('editor/highlight', ({ startLine: range.start.line, startChar: range.start.character, endLine: range.end.line, endChar: range.end.character, uri: msg.uri }));
        } else {
            console.log("The selected UCA could not be found in the editor.");
        }
    });
}


/**
 * Determines the range of the component identified by {@code label} in the editor,
 * @param model The current STPA model.
 * @param label The label of the searched component.
 * @returns The range of the component idenified by the label or undefined if no component was found.
 */
function getRangeOfNode(model: Model, label: string): Range | undefined {
    let range: Range | undefined = undefined;
    const elements: elementWithName[] = [...model.losses, ...model.hazards, ...model.hazards.flatMap(hazard => hazard.subComps), ...model.systemLevelConstraints, ...model.systemLevelConstraints.flatMap(constraint => constraint.subComps), ...model.responsibilities.flatMap(resp => resp.responsiblitiesForOneSystem),
    ...model.allUCAs.flatMap(ucas => ucas.ucas), ...model.rules.flatMap(rule => rule.contexts), ...model.controllerConstraints, ...model.scenarios, ...model.safetyCons];
    if (model.controlStructure) {
        elements.push(...model.controlStructure.nodes);
    }
    elements.forEach(component => {
        if (component.name === label) {
            range = component.$cstNode?.range;
            return;
        }
    });
    return range;
}