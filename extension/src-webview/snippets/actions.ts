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

import { VNode } from "snabbdom";
import { ModelRenderer } from "sprotty";
import { Action, Bounds, RequestAction, ResponseAction, generateRequestId } from "sprotty-protocol";
import { WebviewSnippet } from "./snippet-models";

/** Sent from the view to set the renderer and canvas bounds used for the STPA diagram. */
export interface SendModelRendererAction extends Action {
    kind: typeof SendModelRendererAction.KIND;
    renderer: ModelRenderer;
    bounds: Bounds;
}

export namespace SendModelRendererAction {
    export const KIND = "sendModelRendererAction";

    export function create(renderer: ModelRenderer, bounds: Bounds): SendModelRendererAction {
        return {
            kind: KIND,
            renderer,
            bounds,
        };
    }

    export function isThisAction(action: Action): action is SendModelRendererAction {
        return action.kind === SendModelRendererAction.KIND;
    }
}

/** Request message from the server to the client to get the svgs of the snippets. */
export interface RequestWebviewSnippetsAction extends RequestAction<SendWebviewSnippetsAction> {
    kind: typeof RequestWebviewSnippetsAction.KIND;
    snippets: WebviewSnippet[];
    clientId: string;
    requestId: string;
}

export namespace RequestWebviewSnippetsAction {
    export const KIND = "updateSnippets";

    export function create(snippets: WebviewSnippet[], clientId: string): RequestWebviewSnippetsAction {
        return {
            kind: KIND,
            snippets: snippets,
            clientId,
            requestId: generateRequestId(),
        };
    }

    export function isThisAction(action: Action): action is RequestWebviewSnippetsAction {
        return action.kind === RequestWebviewSnippetsAction.KIND;
    }
}

/** Message to the language server containing the svgs of the snippets. */
export interface SendWebviewSnippetsAction extends ResponseAction {
    kind: typeof SendWebviewSnippetsAction.KIND;
    snippets: VNode[];
    responseId: string;
}

export namespace SendWebviewSnippetsAction {
    export const KIND = "updateSnippets";

    export function create(snippets: VNode[], requestId: string = ""): SendWebviewSnippetsAction {
        return {
            kind: KIND,
            snippets: snippets,
            responseId: requestId,
        };
    }

    export function isThisAction(action: Action): action is SendWebviewSnippetsAction {
        return action.kind === SendWebviewSnippetsAction.KIND;
    }
}
