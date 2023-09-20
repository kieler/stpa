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

export class DropDownMenuOption implements DropDownOption {
    static readonly ID: string = "cut-sets";
    static readonly NAME: string = "Cut Sets";
    readonly id: string = DropDownMenuOption.ID;
    readonly currentId: string = DropDownMenuOption.ID;
    readonly name: string = DropDownMenuOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.DROPDOWN;
    values: { displayName: string; id: string }[] = [{ displayName: "---", id: "---" }];
    availableValues: { displayName: string; id: string }[] = [{ displayName: "---", id: "---" }];
    readonly initialValue: { displayName: string; id: string } = { displayName: "---", id: "---" };
    currentValue = { displayName: "---", id: "---" };
}

/** {@link Registry} that stores and updates different render options. */
@injectable()
export class CutSetsRegistry extends Registry {
    private _options: Map<string, DropDownOption> = new Map();

    handle(action: Action): void | Action | ICommand {
        if (SendCutSetAction.isThisAction(action)) {
            const dropDownOption = new DropDownMenuOption();
            for (const set of action.cutSets) {
                dropDownOption.availableValues.push({ displayName: set.value, id: set.value });
            }

            this._options.set("cut-sets", dropDownOption);
            this.notifyListeners();
        }
        return UpdateModelAction.create([], { animate: false, cause: action });
    }

    get allOptions(): DropDownOption[] {
        return Array.from(this._options.values());
    }

    getCurrentValue(): any {
        //if the cut sets were not requested yet, there is nothing to highlight
        if (this._options.get("cut-sets")?.availableValues.length === 1) {
            return undefined;
        }
        const selectedCutSet: { displayName: string; id: string } = this._options.get("cut-sets")?.currentValue;
        if (selectedCutSet) {
            //slice the brackets at the start and at the end.
            const selected = selectedCutSet.displayName.slice(1, -1);
            if (selected === "-") {
                return "-";
            } else {
                return selected.split(",");
            }
        }
    }
}
