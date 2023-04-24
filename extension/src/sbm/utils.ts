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

/**
 * Respresents an LTL formula.
 */
export class LTLFormula {
    /** LTL formula */
    formula: string;
    /** description of the LTL formula */
    description: string;
    /** UCA that was used to create the LTL formula */
    ucaId: string;

    contextVariables: string;
    type: string;
}

export class UCA_TYPE {
    static NOT_PROVIDED = "not-provided";
    static PROVIDED = "provided";
    static TOO_EARLY = "too-early";
    static TOO_LATE = "too-late";
    static APPLIED_TOO_LONG = "applied-too-long";
    static STOPPED_TOO_SOON = "stopped-too-soon";
    static WRONG_TIME = "wrong-time";
    static UNDEFINED = "undefined";
}

export class State {
    name: string;
    controlAction: string;
    transitions: Transition[];
}

export const EMPTY_STATE_NAME = "EmptyState";

export class Transition {
    target: string;
    trigger?: string;
    effect?: string;
}

export class Variable {
    name: string;
    type: string;
}