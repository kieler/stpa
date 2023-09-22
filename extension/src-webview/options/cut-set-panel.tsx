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

/** @jsx html */
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { html } from "sprotty";
import { DISymbol } from "../di.symbols";
import { FeatherIcon } from '../feather-icons-snabbdom/feather-icons-snabbdom';
import { SidebarPanel } from "../sidebar";
import { CutSetsRegistry } from "./cut-set-registry";
import { OptionsRenderer } from "./options-renderer";

// TODO: extra panel needed? should not be shown for stpa diagrams
@injectable()
export class CutSetPanel extends SidebarPanel {

    @inject(DISymbol.CutSetsRegistry) private cutSetsRegistry: CutSetsRegistry;
    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;

    @postConstruct()
    init(): void {
        this.cutSetsRegistry.onChange(() => this.update());
    }
    get id(): string {
        return "cut-set-panel";
    }

    get title(): string {
        return "Cut Sets";
    }

    render(): VNode {
        return (
            <div>
                <div class-options__section="true">
                    <h5 class-options__heading="true">Cut Sets</h5>
                    {this.optionsRenderer.renderRenderOptions(
                        this.cutSetsRegistry.allCutSets
                    )}
                </div>
            </div>
        );
    }

    // TODO: other icon?
    get icon(): VNode {
        return <FeatherIcon iconId={"edit-2"} />;
    }
}