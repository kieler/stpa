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

import { TransformationOptionType, ValuedSynthesisOption } from "./option-models";

const hierarchyID = "hierarchy";

/**
 * Boolean option to toggle the hierarchy representation in the relationship graph.
 */
const hierarchicalGraphOption: ValuedSynthesisOption = {
    synthesisOption: {
        id: hierarchyID,
        name: "hierarchy",
        type: TransformationOptionType.CHECK,
        initialValue: true,
        currentValue: true,
        values: [true, false]
        },
    currentValue: true
};


export class StpaSynthesisOptions {

    private options: ValuedSynthesisOption[];

    constructor() {
        this.options = [hierarchicalGraphOption];
    }

    getSynthesisOptions(): ValuedSynthesisOption[] {
        return this.options;
    }

    getHierarchy(): boolean {
        const option = this.options.find(option => option.synthesisOption.id === hierarchyID);
        return option?.currentValue;
    }
}
