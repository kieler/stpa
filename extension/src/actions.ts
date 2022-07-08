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

/** Message to the language server to update the model and hence the view. */
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