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

interface Action {
    kind: string;
}

export interface ExecuteTemplateAction extends Action {
    kind: typeof ExecuteTemplateAction.KIND;
    id: string;
}

export namespace ExecuteTemplateAction {
    export const KIND = "executeTemplate";

    export function create(
        id: string,
    ): ExecuteTemplateAction {
        return {
            kind: KIND,
            id,
        };
    }

    export function isThisAction(action: Action): action is ExecuteTemplateAction {
        return action.kind === ExecuteTemplateAction.KIND;
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