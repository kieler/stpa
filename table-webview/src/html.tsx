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

import { attributesModule, Classes, classModule, eventListenersModule, init, jsx, propsModule, styleModule, VNode } from 'snabbdom';
import { Cell } from './helper'

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
 * Creates a header with the given parameters.
 * @param id Id of the table.
 * @param headers Header Values of the table.
 * @returns the created table as VNode.
 */
export function createTable(id: string, headers: string[]): VNode {
    const children: VNode[] = [];
    for (const head of headers) {
        children.push(<th>{head}</th>);
    }
    const table = <table attrs={{ id: id + "_table" }} ><tr attrs={{ id: "headers" }}>{children}</tr></table>;
    return table;
}

/**
 * Creates a row of a table as VNode.
 * @param id Id of the row.
 * @param values The values of the row in the correct ordering.
 * @returns a row of a table as VNode.
 */
export function createRow(id: string, values: Cell[]): VNode {
    const children: VNode[] = [];
    for (const val of values) {
        const classes: Classes =  {}
        classes[val.cssClass] = true
        children.push(<td class={classes}>{val.value}</td>);
    }
    const row = <tr attrs={{ id: id }}>{children}</tr>;
    return row;
}

/**
 * Creates a cell of a table as VNode.
 * @param value The value of the cell.
 * @returns a cell of a table as VNode.
 */
export function createCell(id: string, value: Cell): VNode {
    const classes: Classes =  {}
    classes[value.cssClass] = true
    return <td class={classes} attrs={{ id: id }}>{value.value}</td>
}