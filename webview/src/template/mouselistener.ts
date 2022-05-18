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

import { MouseListener, SModelElement } from "sprotty";
import { Action } from "sprotty-protocol";

export class TemplateMouseListener extends MouseListener {

    mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        console.log("test");
        return [];
    }

}