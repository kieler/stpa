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
 * @param topDistance The distance of the text to the top border.
 * @param leftDistance The distance of the text to the left border.
 * @returns A selector VNode.
 */
export function createSelector(id: string, index: number, options: string[], topDistance?: string, leftDistance?: string): VNode {
    const optionHtmls = options.map(option => createOption(option))
    if (topDistance && leftDistance) {
        return <select attrs={{ id: id, selectedIndex: index }} style={{position: "absolute", top: topDistance, left: leftDistance}}>{optionHtmls}</select>
    } else if (topDistance) {
        return <select attrs={{ id: id, selectedIndex: index }} style={{position: "absolute", top: topDistance}}>{optionHtmls}</select>
    } else if (leftDistance) {
        return <select attrs={{ id: id, selectedIndex: index }} style={{position: "absolute", left: leftDistance}}>{optionHtmls}</select>
    } else {
        return <select attrs={{ id: id, selectedIndex: index }} style={{position: "absolute"}}>{optionHtmls}</select>
    }
}

/**
 * Creates a table VNode.
 * @param id The id of the table.
 * @param topDistance The distance of the text to the top border.
 * @returns A table VNode.
 */
 export function createTable(id: string, topDistance: string): VNode {
    return <table attrs={{ id: id }} style={{position: "absolute", top: topDistance}}></table>
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
 * Creates a text VNode.
 * @param text The text that should be displayed.
 * @param topDistance The distance of the text to the top border.
 * @returns A text VNode.
 */
export function createText(text: string, topDistance: string): VNode {
    return <pre style={{position: "absolute", left: "10px", top: topDistance}}>{text}</pre>
}