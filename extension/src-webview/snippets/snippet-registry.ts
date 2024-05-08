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
import { ActionHandlerRegistry, IActionHandlerInitializer, ICommand } from "sprotty";
import { Action } from "sprotty-protocol";
import { ActionNotification } from "sprotty-vscode-protocol";
import { VsCodeMessenger } from "sprotty-vscode-webview/lib/services";
import { HOST_EXTENSION } from "vscode-messenger-common";
import { Messenger } from "vscode-messenger-webview";
import { Registry } from "../base/registry";
import { DISymbol } from "../di.symbols";
import { RequestWebviewSnippetsAction, SendModelRendererAction, SendWebviewSnippetsAction } from "./actions";
import { SnippetRenderer } from "./snippet-renderer";

/**
 * {@link Registry} that stores and manages snippets provided by the server.
 *
 * Acts as an action handler that handles UpdateSnippetActions.
 */
@injectable()
export class SnippetRegistry extends Registry implements IActionHandlerInitializer {
    readonly position = -10;
    @inject(VsCodeMessenger) protected messenger: Messenger;
    @inject(DISymbol.SnippetRenderer) private snippetRenderer: SnippetRenderer;

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(RequestWebviewSnippetsAction.KIND, this);
        registry.register(SendModelRendererAction.KIND, this);
    }

    handle(action: Action): void | Action | ICommand {
        if (RequestWebviewSnippetsAction.isThisAction(action)) {
            this.handleRequestWebviewSnippets(action);
        } else if (SendModelRendererAction.isThisAction(action)) {
            this.handleSendModelRenderer(action);
        }
    }

    /**
     * Renders the given snippets and sends back.
     * @param action The action containing the snippets to render.
     */
    private handleRequestWebviewSnippets(action: RequestWebviewSnippetsAction): void {
        const snippets = this.snippetRenderer.renderSnippets(action.snippets);
        const response: SendWebviewSnippetsAction = {
            kind: SendWebviewSnippetsAction.KIND,
            snippets: snippets,
            responseId: action.requestId,
        };
        this.messenger.sendNotification(ActionNotification, HOST_EXTENSION, {
            clientId: action.clientId,
            action: response,
        });
    }

    /**
     * Sets the renderer and canvas bounds needed to render the snippets properly.
     * @param action The action containing the renderer and bounds.
     */
    private handleSendModelRenderer(action: SendModelRendererAction): void {
        this.snippetRenderer.setModelRenderer((action as SendModelRendererAction).renderer);
        this.snippetRenderer.setBounds((action as SendModelRendererAction).bounds);
    }
}
