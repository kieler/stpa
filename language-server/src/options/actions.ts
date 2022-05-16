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

import { Action } from "sprotty-protocol";
import { Template } from "../templates/templates";
import { SynthesisOption, ValuedSynthesisOption } from "./option-models";

/** Request message from the server to update the diagram options widget on the client. */
export interface UpdateOptionsAction extends Action {
    kind: typeof UpdateOptionsAction.KIND
    valuedSynthesisOptions: ValuedSynthesisOption[]
    templates: Template[]
    clientId: string
}

export namespace UpdateOptionsAction {
    export const KIND = "updateOptions"

    export function create(
        valuedSynthesisOptions: ValuedSynthesisOption[],
        templates: Template[],
        clientId: string,
    ): UpdateOptionsAction {
        return {
            kind: KIND,
            valuedSynthesisOptions,
            templates,
            clientId,
        }
    }

    export function isThisAction(action: Action): action is UpdateOptionsAction {
        return action.kind === UpdateOptionsAction.KIND;
    }
}


/** Change the value of one or multiple synthesis options. */
export interface SetSynthesisOptionsAction extends Action {
    kind: typeof SetSynthesisOptionsAction.KIND
    options: SynthesisOption[]
}

export namespace SetSynthesisOptionsAction {
    export const KIND = "setSynthesisOptions"

    export function create(options: SynthesisOption[]): SetSynthesisOptionsAction {
        return {
            kind: KIND,
            options,
        }
    }

    export function isThisAction(action: Action): action is SetSynthesisOptionsAction {
        return action.kind === SetSynthesisOptionsAction.KIND;
    }
}
