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


import { LangiumSprottySharedServices } from "langium-sprotty";
import { LangiumSharedServices } from "langium";
import { getModel } from "../utils";

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