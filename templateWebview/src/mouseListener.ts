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

import { ExecuteTemplateAction } from "./actions";

export function click(event: MouseEvent) {
    let node = event.target;
    let owner = (node as SVGElement).ownerSVGElement;
    if (owner) {
        const action = { kind: ExecuteTemplateAction.KIND, id: owner.id } as ExecuteTemplateAction;
        return action;
    }
    return undefined;
}