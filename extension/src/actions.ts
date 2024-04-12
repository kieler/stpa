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

/** Message to the language server to update the model and hence the view. */
// export interface UpdateViewAction extends Action {
//     kind: typeof UpdateViewAction.KIND;
//     options?: JsonMap;
// }

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

/** Send from client to server to start a cut set analysis with the start node given by the startId */
export interface CutSetAnalysisAction extends Action {
    kind: typeof CutSetAnalysisAction.KIND;
    startId: string
}
export namespace CutSetAnalysisAction {
    export const KIND = 'cutSetAnalysis';

    export function create(startId: string,): CutSetAnalysisAction {
        return {
            kind: KIND,
            startId,
        };
    }
}

/** Send from client to server to start a minimal cut set analysis with the start node given by the startId */
export interface MinimalCutSetAnalysisAction extends Action {
    kind: typeof MinimalCutSetAnalysisAction.KIND;
    startId: string
}
export namespace MinimalCutSetAnalysisAction {
    export const KIND = 'minimalCutSetAnalysis';

    export function create(startId: string,): MinimalCutSetAnalysisAction {
        return {
            kind: KIND,
            startId,
        };
    }
}

/** Message to the language server to add a template. */
export interface AddTemplateAction extends Action {
    kind: typeof AddTemplateAction.KIND;
    text: string;
}

export namespace AddTemplateAction {
    export const KIND = "addTemplate";

    export function create(text: string): AddTemplateAction {
        return {
            kind: KIND,
            text
        };
    }

    export function isThisAction(action: Action): action is AddTemplateAction {
        return action.kind === AddTemplateAction.KIND;
    }
}

/** Message containing templates as string. */
export interface SendTemplatesAction extends Action {
    kind: typeof SendTemplatesAction.KIND;
    temps: string[];
}

export namespace SendTemplatesAction {
    export const KIND = "sendTemplates";

    export function create(temps: string[]): SendTemplatesAction {
        return {
            kind: KIND,
            temps
        };
    }

    export function isThisAction(action: Action): action is SendTemplatesAction {
        return action.kind === SendTemplatesAction.KIND;
    }
}