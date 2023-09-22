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

import { Action, JsonMap } from "sprotty-protocol";

/** Contains config option values */
export interface SendConfigAction extends Action {
    kind: typeof SendConfigAction.KIND;
    options: { id: string; value: any }[];
}

export namespace SendConfigAction {
    export const KIND = "sendConfig";

    export function create(options: { id: string; value: any }[]): SendConfigAction {
        return {
            kind: KIND,
            options,
        };
    }

    export function isThisAction(action: Action): action is SendConfigAction {
        return action.kind === SendConfigAction.KIND;
    }
}

/** Send to server to generate SVGs for the STPA result report */
export interface GenerateSVGsAction extends Action {
    kind: typeof GenerateSVGsAction.KIND;
    uri: string;
    options?: JsonMap;
}

export namespace GenerateSVGsAction {
    export const KIND = "generateSVGs";

    export function create(uri: string, options?: JsonMap): GenerateSVGsAction {
        return {
            kind: KIND,
            uri,
            options,
        };
    }

    export function isThisAction(action: Action): action is GenerateSVGsAction {
        return action.kind === GenerateSVGsAction.KIND;
    }
}

// TODO: better type for cut sets
/** Contains the cut sets for a fault tree */
export interface SendCutSetAction extends Action {
    kind: typeof SendCutSetAction.KIND;
    cutSets: string[];
}

 export namespace SendCutSetAction {
    export const KIND = "sendCutSets";

    export function create(cutSets: string[]): SendCutSetAction {
        return {
            kind: KIND,
            cutSets
        };
    }

    export function isThisAction(action: Action): action is SendCutSetAction {
        return action.kind === SendCutSetAction.KIND;
    }
} 
