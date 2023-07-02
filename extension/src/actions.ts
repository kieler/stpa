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

import { Action, JsonMap } from "sprotty-protocol";

/** Request message from the server to update the diagram options widget on the client. */
export interface UpdateViewAction extends Action {
    kind: typeof UpdateViewAction.KIND;
    options?: JsonMap;
}

export namespace UpdateViewAction {
    export const KIND = "updateView";

    export function create(options?: JsonMap): UpdateViewAction {
        return {
            kind: KIND,
            options
        };
    }

    export function isThisAction(action: Action): action is UpdateViewAction {
        return action.kind === UpdateViewAction.KIND;
    }
}

/** Contains config option values */
export interface SendConfigAction extends Action {
    kind: typeof SendConfigAction.KIND;
    options: { id: string, value: any; }[];
}

export namespace SendConfigAction {
    export const KIND = "sendConfig";

    export function create(options: { id: string, value: any; }[]): SendConfigAction {
        return {
            kind: KIND,
            options
        };
    }

    export function isThisAction(action: Action): action is SendConfigAction {
        return action.kind === SendConfigAction.KIND;
    }
}



export interface SendCutSetAction extends Action {
    kind: typeof SendCutSetAction.KIND;
    cutSets: { id: string, value: any; }[];
}

 export namespace SendCutSetAction {
    export const KIND = "sendCutSet";

    export function create(cutSets: { id: string, value: any; }[]): SendCutSetAction {
        return {
            kind: KIND,
            cutSets
        };
    }

    export function isThisAction(action: Action): action is SendCutSetAction {
        return action.kind === SendCutSetAction.KIND;
    }
} 

export interface SelectCutSetAction extends Action {
    kind: typeof SelectCutSetAction.KIND;
    id: string;
}

 export namespace SelectCutSetAction {
    export const KIND = "selectCutSet";

    export function create(id: string): SelectCutSetAction {
        return {
            kind: KIND,
            id
        };
    }

    export function isThisAction(action: Action): action is SelectCutSetAction {
        return action.kind === SelectCutSetAction.KIND;
    }
}