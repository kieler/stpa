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

import * as vscode from "vscode";
import { TableWebview } from '@kieler/table-webview/lib/table-webview';

export class ContextTablePanel extends TableWebview {

  protected currentData: any[];

  constructor(identifier: string, localResourceRoots: vscode.Uri[], scriptUri: vscode.Uri) {
    super(identifier, localResourceRoots, scriptUri);
    this.createWebviewPanel([]);
  }

  setData(list: any[]): void {
    if (list.length == 3) {
      this.currentData = list;
      this.sendToWebview(this.currentData);
    } else {
      console.log("Data has wrong format. List length should be 3, but is " + list.length);
    }
  }

}