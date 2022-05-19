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

import { inject } from 'inversify'
import { MouseListener, SModelElement } from "sprotty";
import { Action } from "sprotty-protocol";
import { vscodeApi } from 'sprotty-vscode-webview/lib/vscode-api';
import { DISymbol } from '../di.symbols';
import { ExecuteTemplateAction } from './actions';
import { TemplateRegistry } from './template-registry';

export class TemplateMouseListener extends MouseListener {

    @inject(DISymbol.TemplateRegistry) private tempRegistry: TemplateRegistry;

    mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        // TODO: determine template that is clicked on
        const action: ExecuteTemplateAction = {
            kind: ExecuteTemplateAction.KIND,
            code: "test"
        };
        vscodeApi.postMessage({clientId: this.tempRegistry.clientId, action: action});
        return [];
    }

}