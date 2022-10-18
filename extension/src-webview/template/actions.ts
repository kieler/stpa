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

import { VNode } from 'snabbdom';
import { Action, Bounds, RequestAction, ResponseAction, generateRequestId } from "sprotty-protocol";
import { ModelRenderer } from "sprotty";
import { WebviewTemplate } from "./template-models";

/** Sent from the view. */
export interface SendModelRendererAction extends Action {
    kind: typeof SendModelRendererAction.KIND;
    renderer: ModelRenderer;
    bounds: Bounds;
}

export namespace SendModelRendererAction {
    export const KIND = 'sendModelRendererAction';

    export function create(renderer: ModelRenderer, bounds: Bounds): SendModelRendererAction {
        return {
            kind: KIND,
            renderer,
            bounds
        };
    }

    export function isThisAction(action: Action): action is SendModelRendererAction {
        return action.kind === SendModelRendererAction.KIND;
    }
}

/** Request message from the server to get the svgs for the templates. */
export interface RequestWebviewTemplatesAction extends RequestAction<SendWebviewTemplatesAction> {
    kind: typeof RequestWebviewTemplatesAction.KIND;
    templates: WebviewTemplate[];
    clientId: string;
    requestId: string;
}

export namespace RequestWebviewTemplatesAction {
    export const KIND = "updateTemplates";

    export function create(
        templates: WebviewTemplate[],
        clientId: string
    ): RequestWebviewTemplatesAction {
        return {
            kind: KIND,
            templates,
            clientId,
            requestId: generateRequestId()
        };
    }

    export function isThisAction(action: Action): action is RequestWebviewTemplatesAction {
        return action.kind === RequestWebviewTemplatesAction.KIND;
    }
}

export interface SendWebviewTemplatesAction extends ResponseAction {
    kind: typeof SendWebviewTemplatesAction.KIND;
    templates: VNode[];
    responseId: string;
}

export namespace SendWebviewTemplatesAction {
    export const KIND = "updateTemplates";

    export function create(
        templates: VNode[],
        requestId: string = ''
    ): SendWebviewTemplatesAction {
        return {
            kind: KIND,
            templates,
            responseId: requestId
        };
    }

    export function isThisAction(action: Action): action is SendWebviewTemplatesAction {
        return action.kind === SendWebviewTemplatesAction.KIND;
    }
}
