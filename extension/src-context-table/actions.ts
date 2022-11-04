/* eslint-disable @typescript-eslint/no-namespace */
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

import { ContextTableData } from "./utils";

interface Action {
    kind: string;
}

/** Adds a row to the table. */
export interface SendContextTableDataAction extends Action {
    kind: typeof SendContextTableDataAction.KIND;
    //TODO: determine correct type
    data: ContextTableData;
}


export namespace SendContextTableDataAction {
    export const KIND = "sendContextTableData";

    export function create(
        data: ContextTableData
    ): SendContextTableDataAction {
        return {
            kind: SendContextTableDataAction.KIND,
            data
        };
    }

    export function isThisAction(action: Action): action is SendContextTableDataAction {
        return action.kind === SendContextTableDataAction.KIND;
    }
}
