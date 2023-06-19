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
import { ActionHandlerRegistry, CommandStack, SModelFactory, TYPES } from "sprotty";
import { Action, ActionMessage } from "sprotty-protocol";
import { VscodeLspEditDiagramServer } from "sprotty-vscode-webview/lib/lsp/editing";
import { RequestSvgAction, SvgAction } from "./actions";
import { CustomSvgExporter } from "./exporter";

@injectable()
export class StpaDiagramServer extends VscodeLspEditDiagramServer {

    @inject(TYPES.SvgExporter) protected svgExporter: CustomSvgExporter;
    @inject(TYPES.IModelFactory) protected modelFactory: SModelFactory;
    @inject(TYPES.ICommandStack) protected commandStack: CommandStack;

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
                this.handleRequestSvgAction(action as RequestSvgAction);
        }
        return super.handleLocally(action);
    }
    handleRequestSvgAction(action: RequestSvgAction): boolean {
        const root = this.modelFactory.createRoot(this.currentRoot);
        // this.commandStack.update(root, action);
        root.canvasBounds = { x: 0, y: 0, height: 1200, width: 600 };
        const svg = this.svgExporter.internalExport(root);
        if (svg) {
            this.forwardToServer(SvgAction.create(svg, action.requestId));
        }
        return false;
    }

}