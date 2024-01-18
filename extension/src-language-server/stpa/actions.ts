/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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

import { Action, JsonMap, RequestAction, generateRequestId, ResponseAction } from "sprotty-protocol";

/** Send to server to generate SVGs for the STPA result report */
export interface GenerateSVGsAction extends Action {
    kind: typeof GenerateSVGsAction.KIND
    uri: string
    options?: JsonMap;
}

export namespace GenerateSVGsAction {
    export const KIND = "generateSVGs";
    

    export function create(
        uri: string,
        options?: JsonMap
    ): GenerateSVGsAction {
        return {
            kind: KIND,
            uri,
            options
        };
    }

    export function isThisAction(action: Action): action is GenerateSVGsAction {
        return action.kind === GenerateSVGsAction.KIND;
    }
}

/** Requests the current SVG from the client. */
export interface RequestSvgAction extends RequestAction<SvgAction> {
    kind: typeof RequestSvgAction.KIND
}

export namespace RequestSvgAction {
    export const KIND = 'requestSvg';

    export function create(): RequestSvgAction {
        return {
            kind: KIND,
            requestId: generateRequestId()
        };
    }
}

/** Send from client to server containing the requested SVG and its width. */
export interface SvgAction extends ResponseAction {
    kind: typeof SvgAction.KIND;
    svg: string
    width: number
    responseId: string
}
export namespace SvgAction {
    export const KIND = 'svg';

    export function create(svg: string, width: number, requestId: string): SvgAction {
        return {
            kind: KIND,
            svg,
            width,
            responseId: requestId
        };
    }
}