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

export function createSelector() {

}

/**
 * Adds the given {@code options} to the given {@code selector}.
 * @param selector The selection element.
 * @param options A list of options to add.
 */
export function updateSelector(selector: HTMLSelectElement, options: string[]) {
    selector.remove(...options)
    // make an option element for each array entry and append it to the selection element
    /* options.forEach(option => {
        let opt = document.createElement('option');
        opt.value = option;
        opt.innerHTML = option;
        selector.appendChild(opt);
    }) */
}