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

/** Needed to update the html document */
export const patch = init([
    // Init patch function with chosen modules
    propsModule, // for setting properties on DOM elements
    styleModule, // handles styling on elements with support for animations
    eventListenersModule, // attaches event listeners
    attributesModule, // for using attributes on svg elements
    // IMPORTANT: classModule must be after attributesModule. Otherwise it does not work when classes are also in the attributes list.
    classModule // makes it easy to toggle classes
]);

/**
 * Creates a selector with the given attributes.
 * @param id ID of the selector.
 * @param index Selected Index of the selector.
 * @param options The options the selector contains.
 * @returns A selector VNode.
 */
export function createSelector(id: string, index: number, options: string[]): VNode {
    const optionHtmls = options.map(option => createOption(option))
    return <select attrs={{ id: id, selectedIndex: index }} style={{position: "absolute", top: "11px", left: "210px"}}>{optionHtmls}</select>
}

/**
 * Creates an option for a selector.
 * @param option The text of the option.
 * @returns An option VNode.
 */
function createOption(option: string): VNode {
    return <option attrs={{ value: option }}>{option}</option>
}

/**
 * Creates a new selector with the given {@code options} that replaces the given {@code selector}.
 * @param selector The selection element to replace.
 * @param options A list of options the new selector should have.
 * @param index The selected index of the selector.
 * @returns A new selector VNode.
 */
export function replaceSelector(selector: HTMLSelectElement, options: string[], index: number): VNode {
    const newSelector = createSelector(selector.id, index, options)
    patch(selector, newSelector)
    return newSelector
}

/**
 * Creates a text VNode.
 * @param text The text that should be displayed.
 * @returns A text VNode.
 */
export function createText(text: string): VNode {
    return <pre style={{position: "absolute", left: "10px"}}>{text}</pre>
}