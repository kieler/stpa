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

import { ExecuteSnippetAction } from "./actions";

/**
 * Determines the snippet that was clicked on and creates an ExecuteSnippetAction with the snippet's id.
 * @param event The mouse event that was triggered.
 * @returns the action to execute the snippet or undefined if no snippet was clicked.
 */
export function click(event: MouseEvent): ExecuteSnippetAction | undefined {
    const node = event.target;
    const owner = (node as SVGElement).ownerSVGElement;
    if (owner) {
        const action = { kind: ExecuteSnippetAction.KIND, id: owner.id } as ExecuteSnippetAction;
        return action;
    }
    return undefined;
}
