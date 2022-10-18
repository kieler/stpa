/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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
import { html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { DISymbol } from "../di.symbols";
import { FeatherIcon } from "../feather-icons-snabbdom/feather-icons-snabbdom";
import { SidebarPanel } from "../sidebar";
import { OptionsRenderer } from "./options-renderer";
import { RenderOptionsRegistry } from "./render-options-registry";

/** Type for available quick actions. */

/**
 * Sidebar panel that displays general diagram configurations,
 * such as quick actions, changing the synthesis or preferences.
 */
@injectable()
export class GeneralPanel extends SidebarPanel {
    // This panel should always have the first trigger in the sidebar
    readonly position = -10;

    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;

    @postConstruct()
    init(): void {
        // Subscribe to different registry changes to make this panel reactive
        this.renderOptionsRegistry.onChange(() => this.update());
    }

    get id(): string {
        return "general-panel";
    }

    get title(): string {
        return "General";
    }

    render(): VNode {
        return (
            <div>
                <div class-options__section="true">
                    <h5 class-options__heading="true">Render Options</h5>
                    {this.optionsRenderer.renderRenderOptions(
                        this.renderOptionsRegistry.allRenderOptions
                    )}
                </div>
            </div>
        );
    }

    get icon(): VNode {
        return <FeatherIcon iconId={"settings"}/>;
    }
}
