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

/** @jsx html */
import { html } from './jsx';
import { attributesModule, classModule, eventListenersModule, init, propsModule, styleModule, VNode } from 'snabbdom';

const placeholderID = 'tempPlaceholder';
export const txtID = 'tempAddTextField';
export const bntID = 'tempAddBnt';

export const panel: VNode = <div class-sidebar__content="true">
    <h3 class-sidebar__title="true">{"Templates"}</h3>
    <input type="text" id={txtID} />
    <button type="button" id={bntID}>Add Template</button>
    <div class-sidebar__panel-content="true" id="templates"><div id={placeholderID}></div></div>
</div>;

export const patch = init([
    // Init patch function with chosen modules
    propsModule, // for setting properties on DOM elements
    styleModule, // handles styling on elements with support for animations
    eventListenersModule, // attaches event listeners
    attributesModule, // for using attributes on svg elements
    // IMPORTANT: classModule must be after attributesModule. Otherwise it does not work when classes are also in the attributes list.
    classModule // makes it easy to toggle classes
]);

export function createTemps(templates: VNode[]) {
    let placeholder = document.getElementById('tempPlaceholder');
    if (placeholder) {
        const temps = <div id={placeholderID}>{...templates}</div>;
        patch(placeholder, temps);
    }
}