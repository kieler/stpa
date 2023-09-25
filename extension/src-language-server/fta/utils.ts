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

import { Component, Condition, Gate, TopEvent } from "../generated/ast";

export type namedFtaElement = Component | Condition | Gate | TopEvent;

/**
 * Translates the cut sets in the given {@code cutSets} to lists.
 * @param cutSets The list containing the cut sets to translate.
 * @returns a list containing the cut sets in {@code cutSets} as a list.
 */
export function cutSetsToString(cutSets: Set<namedFtaElement>[]): string[][] {
    const result: string[][] = [];
    for (const set of cutSets) {
        const newSet: string[] = [];
        set.forEach((element) => newSet.push(element.name));
        result.push(newSet);
    }
    return result;
}
