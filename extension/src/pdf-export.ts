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

import * as vscode from 'vscode';

export function createPdf(data: { id: string, description: string, references: string; }[][], uri: vscode.Uri): void {
    // create a markdown file
    const markdown = createMarkdownFile();
    // create a pdf file
    // markdownpdf().from("/path/to/document.md").to("/path/to/document.pdf", function () {
        console.log("Done");
    //   })
}

function createMarkdownFile(): void {

}