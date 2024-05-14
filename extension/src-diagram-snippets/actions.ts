/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2024 by
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

/** Message to the language server to add definition of a selected snippet in the editor. */
export interface ExecuteSnippetAction extends Action {
    kind: typeof ExecuteSnippetAction.KIND;
    id: string;
}

export namespace ExecuteSnippetAction {
    export const KIND = "executeSnippet";

    export function create(id: string): ExecuteSnippetAction {
        return {
            kind: KIND,
            id,
        };
    }

    export function isThisAction(action: Action): action is ExecuteSnippetAction {
        return action.kind === ExecuteSnippetAction.KIND;
    }
}

/** Message to the language server to add a snippet to the librabry. */
export interface AddSnippetAction extends Action {
    kind: typeof AddSnippetAction.KIND;
    text: string;
}

export namespace AddSnippetAction {
    export const KIND = "addSnippet";

    export function create(text: string): AddSnippetAction {
        return {
            kind: KIND,
            text,
        };
    }

    export function isThisAction(action: Action): action is AddSnippetAction {
        return action.kind === AddSnippetAction.KIND;
    }
}
