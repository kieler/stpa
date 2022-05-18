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