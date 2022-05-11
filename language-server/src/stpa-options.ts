/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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

/**
 * Contains options regarding the layout of the STPA graph.
 */
export class StpaOptions {
    // true: subcomponents are contained in their parents
    // false: subcomponents have edges to their parents
    private hierarchy: boolean

    constructor(){
        this.hierarchy = true
    }

    /**
     * Toggles the hierarchy option.
     */
    toggleHierarchy() {
        this.hierarchy = !this.hierarchy
    }

    getHierarchy() {
        return this.hierarchy
    }

}
