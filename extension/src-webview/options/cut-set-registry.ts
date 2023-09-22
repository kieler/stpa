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

import { injectable } from "inversify";
import { ICommand } from "sprotty";
import { Action, UpdateModelAction } from "sprotty-protocol";
import { Registry } from "../base/registry";
import { SendCutSetAction } from "./actions";
import { DropDownOption, TransformationOptionType } from "./option-models";


const noSelectedCutSet = { displayName: "---", id: "---" };

// TODO: should be a synthesis option ??
export class DropDownMenuOption implements DropDownOption {
    static readonly ID = "cut-sets";
    static readonly NAME = "Cut Sets";
    readonly id = DropDownMenuOption.ID;
    readonly currentId = DropDownMenuOption.ID;
    readonly name = DropDownMenuOption.NAME;
    readonly type = TransformationOptionType.DROPDOWN;
    values = [noSelectedCutSet];
    availableValues = [noSelectedCutSet];
    readonly initialValue = noSelectedCutSet;
    currentValue = noSelectedCutSet;
}

/** {@link Registry} that stores and updates cut set options. */
@injectable()
export class CutSetsRegistry extends Registry {
    private _options: Map<string, DropDownOption> = new Map();

    handle(action: Action): void | Action | ICommand {
        if (SendCutSetAction.isThisAction(action)) {
            const dropDownOption = new DropDownMenuOption();
            for (const set of action.cutSets) {
                dropDownOption.availableValues.push({ displayName: set, id: set });
            }

            this._options.set("cut-sets", dropDownOption);
            this.notifyListeners();
        }
        return UpdateModelAction.create([], { animate: false, cause: action });
    }

    get allCutSets(): DropDownOption[] {
        return Array.from(this._options.values());
    }

    getCurrentValue(): string[] | undefined {
        // if the cut sets were not requested yet, there are no cut sets to display
        if (this._options.get("cut-sets")?.availableValues.length === 1) {
            return undefined;
        }
        const selectedCutSet: { displayName: string; id: string } = this._options.get("cut-sets")?.currentValue;
        if (selectedCutSet) {
            // slice the brackets at the start and at the end.
            const selected = selectedCutSet.displayName.slice(1, -1);
            if (selected === "-") {
                return undefined;
            } else {
                // determine the names in the cut set
                return selected.split(",").map(element => element.trim());
            }
        }
    }
}
