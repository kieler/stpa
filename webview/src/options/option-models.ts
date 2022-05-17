/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018-2022 by
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

import { SGraph } from "sprotty-protocol";

/** Base option that can be rendered as an ui input*/
export interface RenderOption {
    id: string;
    name: string;
    type: TransformationOptionType;
    initialValue: any;
    currentValue: any;
    description?: string;
}

export interface ChoiceRenderOption extends RenderOption {
    availableValues: string[];
}

/**
 * Holds an option defined by the diagram synthesis.
 * This is the counterpart to the language server implementation of the SynthesisOption.
 */
 export interface SynthesisOption extends RenderOption {
    values: any[]
    category?: SynthesisOption
}

/**
 * This is just a SynthesisOption with the ability to represent its current value.
 */
export interface ValuedSynthesisOption {
    synthesisOption: SynthesisOption
    currentValue: any
}

/**
 * A SynthesisOption with the RANGE type.
 */
export interface RangeOption extends SynthesisOption {
    range: Range
    stepSize: number
}

/**
 * The different types a SynthesisOption can have.
 */
export enum TransformationOptionType {
    CHECK = 0,
    CHOICE = 1,
    RANGE = 2,
    TEXT = 3,
    SEPARATOR = 4,
    CATEGORY = 5,
}

/**
 * A value range between a first and second value.
 */
 export interface Range {
    first: number
    second: number
}

/**
 * A key-value pair matching the interface of org.eclipse.xtext.xbase.lib.Pair
 */
export interface Pair<K, V> {
    k: K
    v: V
}

export interface Template {
    svg: Readonly<SGraph>;
    code: string;
}
