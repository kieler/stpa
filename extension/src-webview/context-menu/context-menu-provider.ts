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

import { injectable } from "inversify";
import { IContextMenuItemProvider, LabeledAction, SModelRoot } from "sprotty";
import { Point } from "sprotty-protocol";
import { FTA_GRAPH_TYPE } from "../fta/fta-model";

@injectable()
export class ContextMenuProvider implements IContextMenuItemProvider {
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point | undefined): Promise<LabeledAction[]> {
        if (root.type === FTA_GRAPH_TYPE) {
            return Promise.resolve([
                {
                    label: "Cut Set Analysis",
                    actions: []
                } as LabeledAction
            ]);
        } else {
            return Promise.resolve([]);
        }
    }

}