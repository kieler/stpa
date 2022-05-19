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

import { Action, Bounds } from "sprotty-protocol";
import { ModelRenderer } from "sprotty"
import { Template } from "./template-models";

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

/** Request message from the server to update the diagram options widget on the client. */
export interface UpdateTemplatesAction extends Action {
    kind: typeof UpdateTemplatesAction.KIND;
    templates: Template[];
    clientId: string;
}

export namespace UpdateTemplatesAction {
    export const KIND = "updateTemplates";

    export function create(
        templates: Template[],
        clientId: string
    ): UpdateTemplatesAction {
        return {
            kind: KIND,
            templates,
            clientId
        };
    }

    export function isThisAction(action: Action): action is UpdateTemplatesAction {
        return action.kind === UpdateTemplatesAction.KIND;
    }
}

export interface ExecuteTemplateAction extends Action {
    kind: typeof ExecuteTemplateAction.KIND;
    code: string;
}

export namespace ExecuteTemplateAction {
    export const KIND = "executeTemplate";

    export function create(
        code: string
    ): ExecuteTemplateAction {
        return {
            kind: KIND,
            code
        };
    }

    export function isThisAction(action: Action): action is ExecuteTemplateAction {
        return action.kind === ExecuteTemplateAction.KIND;
    }
}