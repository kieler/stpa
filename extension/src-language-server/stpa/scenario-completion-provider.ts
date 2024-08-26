/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2024 by
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

import {
    CompletionAcceptor,
    CompletionContext,
    CompletionValueItem,
    DefaultCompletionProvider,
    MaybePromise,
    NextFeature,
} from "langium";
import { CompletionItemKind } from "vscode-languageserver";
import { Context, isVerticalEdge, LossScenario, UCA } from "../generated/ast";

/**
 * Generates UCA text for loss scenarios by providing an additional completion item.
 */
export class STPACompletionProvider extends DefaultCompletionProvider {
    protected enabled: boolean = true;

    /**
     * Overrides the default completionFor method to provide an additional completion item for generating UCA text in loss scenarios.
     * @param context The completion context.
     * @param next The next feature of the current rule to be called.
     * @param acceptor The completion acceptor to add the completion items.
     */
    protected completionFor(
        context: CompletionContext,
        next: NextFeature,
        acceptor: CompletionAcceptor
    ): MaybePromise<void> {
        super.completionFor(context, next, acceptor);
        if (this.enabled) {
            this.completionForScenario(context, next, acceptor);
            this.completionForUCA(context, next, acceptor);
        }
    }

    protected completionForUCA(context: CompletionContext, next: NextFeature, acceptor: CompletionAcceptor): void {
        if (context.node?.$type === UCA && next.property === "description") {
            const generatedItems = this.generateTextForUCAWithPlainText(
                context.node as UCA,
                context.node.$containerProperty
            );

            if (generatedItems.length > 0) {
                generatedItems.forEach(item => acceptor(item));
            }
        }
    }

    protected generateTextForUCAWithPlainText(uca: UCA, property?: string): CompletionValueItem[] {
        const actionUca = uca.$container;
        let controlAction = `the control action '${actionUca.action.ref?.label}'`;
        const parent = actionUca.action.ref?.$container;
        if (isVerticalEdge(parent)) {
            controlAction += ` to ${parent.target.$refText}`;
        }
        switch (property) {
            case "notProvidingUcas":
                const notProvidedItem = {
                    label: "Generate not provided UCA Text",
                    kind: CompletionItemKind.Text,
                    insertText: `${actionUca.system.$refText} did not provide ${controlAction}, `,
                    detail: "Inserts the starting text for this UCA.",
                    sortText: "0",
                };
                return [notProvidedItem];
            case "providingUcas":
                const providedItem = {
                    label: "Generate provided UCA Text",
                    kind: CompletionItemKind.Text,
                    insertText: `${actionUca.system.$refText} provided ${controlAction}, `,
                    detail: "Inserts the starting text for this UCA.",
                    sortText: "0",
                };
                return [providedItem];
            case "wrongTimingUcas":
                const tooEarlyItem = {
                    label: "Generate too-early UCA Text",
                    kind: CompletionItemKind.Text,
                    insertText: `${actionUca.system.$refText} provided ${controlAction} before`,
                    detail: "Inserts the starting text for this UCA.",
                    sortText: "0",
                };
                const tooLateItem = {
                    label: "Generate too-late UCA Text",
                    kind: CompletionItemKind.Text,
                    insertText: `${actionUca.system.$refText} provided ${controlAction} after`,
                    detail: "Inserts the starting text for this UCA.",
                    sortText: "1",
                };
                return [tooEarlyItem, tooLateItem];
            case "continousUcas":
                const stoppedTooSoonItem = {
                    label: "Generate stopped-too-soon UCA Text",
                    kind: CompletionItemKind.Text,
                    insertText: `${actionUca.system.$refText} stopped ${controlAction} before`,
                    detail: "Inserts the starting text for this UCA.",
                    sortText: "0",
                };
                const appliedTooLongItem = {
                    label: "Generate applied-too-long UCA Text",
                    kind: CompletionItemKind.Text,
                    insertText: `${actionUca.system.$refText} still applied ${controlAction} after`,
                    detail: "Inserts the starting text for this UCA.",
                    sortText: "1",
                };
                return [stoppedTooSoonItem, appliedTooLongItem];
        }
        return [];
    }

    protected completionForScenario(context: CompletionContext, next: NextFeature, acceptor: CompletionAcceptor): void {
        if (context.node?.$type === LossScenario && next.property === "description") {
            const generatedText = this.generateScenarioForUCA(context.node as LossScenario);
            if (generatedText !== "") {
                acceptor({
                    label: "Generate UCA Text",
                    kind: CompletionItemKind.Text,
                    insertText: generatedText,
                    detail: "Inserts the UCA text for this scenario.",
                    sortText: "0",
                });
            }
        }
    }

    /**
     * Generates the UCA text for the given scenario {@code scenario}.
     * If no UCA is reference an empty string is returned.
     * @param scenario The scenario node for which the UCA text should be generated.
     */
    protected generateScenarioForUCA(scenario: LossScenario): string {
        const uca = scenario.uca?.ref;
        if (uca) {
            if (uca.$type === Context) {
                return this.generateScenarioForUCAWithContextTable(uca);
            } else {
                return this.generateScenarioForUCAWithPlainText(uca);
            }
        }
        return "";
    }

    /**
     * Generates a scenario text for a UCA defined with a context table.
     * @param uca The UCA for which the scenario should be generated.
     * @returns the generated scenario text.
     */
    protected generateScenarioForUCAWithContextTable(uca: Context): string {
        const rule = uca.$container;
        let text = `${rule.system.$refText}`;
        switch (rule.type) {
            case "not-provided":
                text += ` did not provide the control action ${rule.action.ref?.label}`;
                break;
            case "provided":
                text += ` provided the control action ${rule.action.ref?.label}`;
                break;
            case "stopped-too-soon":
                text += ` stopped the control action ${rule.action.ref?.label} too soon`;
                break;
            case "applied-too-long":
                text += ` applied the control action ${rule.action.ref?.label} too long`;
                break;
            case "too-early":
                text += ` provided the control action ${rule.action.ref?.label} too early`;
                break;
            case "too-late":
                text += ` provided the control action ${rule.action.ref?.label} too late`;
                break;
            case "wrong-time":
                text += ` provided the control action ${rule.action.ref?.label} at the wrong time`;
                break;
        }

        text += `, while`;
        uca.assignedValues.forEach((assignedValue, index) => {
            if (index > 0) {
                text += ", ";
            }
            if ((index += uca.assignedValues.length - 1)) {
                text += ", and";
            }
            text += ` ${assignedValue.variable.$refText} was ${assignedValue.value.$refText}`;
        });
        text += ".";

        return text;
    }

    /**
     * Generates a scenario text for a UCA defined with plain text.
     * @param uca The UCA for which the scenario should be generated.
     * @returns the generated scenario text.
     */
    protected generateScenarioForUCAWithPlainText(uca: UCA): string {
        return uca.description;
    }
}
