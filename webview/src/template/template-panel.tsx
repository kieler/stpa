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

/** @jsx html */
import { VNode } from "snabbdom";
import { html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { inject, injectable, postConstruct } from "inversify";
import { SidebarPanel } from "../sidebar";
import { DISymbol } from "../di.symbols";
import { OptionsRenderer } from "../options/options-renderer";
import { FeatherIcon } from "../feather-icons-snabbdom/feather-icons-snabbdom";
import { TemplateRegistry } from "./template-registry";

/** Sidebar panel that displays server provided STPA-DSL templates.  */
@injectable()
export class TemplatePanel extends SidebarPanel {

    @inject(DISymbol.TemplateRegistry) private tempRegistry: TemplateRegistry;
    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;

    @postConstruct()
    init(): void {
        this.tempRegistry.onChange(() => this.update());
    }

    get id(): string {
        console.log(this.tempRegistry);
        return 'template-panel';
    }

    get title(): string {
        return 'Templates';
    }

    get icon(): VNode {
        return <FeatherIcon iconId={"code"}/>
    }

    render(): VNode {
        return this.tempRegistry.hasTemplateOptions() ? (
            this.optionsRenderer.renderTemplates(this.tempRegistry.templates)
        ) : (
            <span>No templates provided by the diagram server.</span>
        );
    }

}