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
 * Translates the given {@code cutSets} to a string.
 * @param cutSets The cut sets to translate.
 * @param minimal Determines whether the given {@code cutSets} are minimal.
 * @returns a string that contains every cut set.
 */
export function cutSetsToString(cutSets: Set<namedFtaElement>[], minimal?: boolean): string {
    let text = `The resulting ${cutSets.length}`;
    if (minimal) {
        text += ` minimal`;
    }
    text += ` cut sets are:\n`;
    text += `[${cutSets.map((cutSet) => `[${[...cutSet].map((element) => element.name).join(", ")}]`).join(",\n")}]`;
    return text;
}
