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
import { Action, RequestAction, ResponseAction, generateRequestId } from "sprotty-protocol";
import { WebviewTemplate } from "./template-model";

/** Request message from the server to get the svgs of the templates. */
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

/** Message to the language server containing the svgs of the templates. */
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

/** Message to the language server to start the execution of a template. */
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