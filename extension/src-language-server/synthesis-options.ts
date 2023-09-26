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

import { ValuedSynthesisOption } from "./options/option-models";

export class SynthesisOptions {
    protected options: ValuedSynthesisOption[];

    constructor() {
        this.options = [];
    }

    getSynthesisOptions(): ValuedSynthesisOption[] {
        return this.options;
    }

    protected getOption(id: string): ValuedSynthesisOption | undefined {
        const option = this.options.find((option) => option.synthesisOption.id === id);
        return option;
    }
}