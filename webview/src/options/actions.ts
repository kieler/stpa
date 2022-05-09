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

/** Change the value of one or multiple render options. */
export interface SetRenderOptionAction extends Action {
    kind: typeof SetRenderOptionAction.KIND
    id: string
    value: unknown
}

export namespace SetRenderOptionAction {
    export const KIND = "setRenderOption"

    export function create(id: string, value: unknown): SetRenderOptionAction {
        return {
            kind: KIND,
            id,
            value
        }
    }

    export function isThisAction(action: Action): action is SetRenderOptionAction {
        return action.kind === SetRenderOptionAction.KIND;
    }
}

/** Resets all render options to default. */
export interface ResetRenderOptionsAction extends Action {
    kind: typeof ResetRenderOptionsAction.KIND
}

export namespace ResetRenderOptionsAction {
    export const KIND = "resetRenderOptions"

    export function create(): ResetRenderOptionsAction {
        return {
            kind: KIND,
        }
    }

    export function isThisAction(action: Action): action is ResetRenderOptionsAction {
        return action.kind === ResetRenderOptionsAction.KIND;
    }
}