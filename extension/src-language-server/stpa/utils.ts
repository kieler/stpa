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

export function getControlActions(uri: string, shared: LangiumSprottySharedServices | LangiumSharedServices): Record<string, string[]> {
    const actions: Record<string, string[]> = {};
    const model = getModel(uri, shared);
    model.controlStructure?.nodes.forEach(systemComponent => {
        // control actions of the current system component
        systemComponent.actions.forEach(action => {
            action.comms.forEach(command => {
                const actionList = actions[systemComponent.name];
                if (actionList !== undefined) {
                    actionList.push(command.name);
                } else {
                    actions[systemComponent.name] = [command.name];
                }
            });
        });
    });
    return actions;
}