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

import { inject, injectable } from "inversify";
import { TYPES, SModelFactory, ActionHandlerRegistry } from "sprotty";
import { Action, ActionMessage } from "sprotty-protocol";
import { VscodeLspEditDiagramServer } from "sprotty-vscode-webview/lib/lsp/editing";
import { RequestSvgAction } from "./actions";
import { CustomSvgExporter } from "./exporter";

@injectable()
export class StpaDiagramServer extends VscodeLspEditDiagramServer {

    @inject(TYPES.SvgExporter) protected svgExporter: CustomSvgExporter;
    @inject(TYPES.IModelFactory) protected modelFactory: SModelFactory;

    protected sendMessage(message: ActionMessage): void {
        console.log("send to server: " + message.action.kind);
        super.sendMessage(message);
    }

    initialize(registry: ActionHandlerRegistry): void {
        super.initialize(registry);
        registry.register(RequestSvgAction.KIND, this);
    }

    handleLocally(action: Action): boolean {
        switch (action.kind) {
            case RequestSvgAction.KIND:
                const root = this.modelFactory.createRoot(this.currentRoot);
                const svg = this.svgExporter.internalExport(root);
                console.log("generated svg");
            // this.sendMessage();
        }
        return super.handleLocally(action);
    }

}