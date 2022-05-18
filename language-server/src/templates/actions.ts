/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import { Action } from "sprotty-protocol";
import { Template } from "../templates/templates";

/** Request message from the server to update the diagram options widget on the client. */
export interface UpdateTemplatesAction extends Action {
    kind: typeof UpdateTemplatesAction.KIND;
    templates: Template[];
}

export namespace UpdateTemplatesAction {
    export const KIND = "updateTemplates";

    export function create(
        templates: Template[],
    ): UpdateTemplatesAction {
        return {
            kind: KIND,
            templates,
        };
    }

    export function isThisAction(action: Action): action is UpdateTemplatesAction {
        return action.kind === UpdateTemplatesAction.KIND;
    }
}