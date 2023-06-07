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
import { createFile } from './utils';

export async function createPdf(data: { id: string, description: string, references: string; }[][]): Promise<void> {
    // create a markdown file
    const markdown = createMarkdownText(data);

    // Ask the user where to save the sbm
    const currentFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
    const uri = await vscode.window.showSaveDialog({
        filters: { Markdown: ['md'] },
        // TODO: not possible with current vscode version
        // title: 'Save Markdown to...',
        defaultUri: currentFolder ? vscode.Uri.file(`${currentFolder}/report.md`) : undefined,
    });
    if (uri === undefined) {
        // The user did not pick any file to save to.
        return;
    }

    createFile(uri.path, markdown);


    // create a pdf file
    // markdownpdf().from("/path/to/document.md").to("/path/to/document.pdf", function () {
        console.log("Done");
    //   })
}

const headers =["Losses", "Hazards", "System-level Constraints", "Controller Constraints", "Loss Scenarios", "Safety Requirements"];

function createMarkdownText(data: { id: string, description: string, references: string; }[][]): string {
    // TODO: add control structure, responsibilities, and UCAs
    let markdown = "";
    for (let i=0; i<data.length; i++) {
        const section = data[i];
        markdown += `## ${headers[i]}\n\n`;
        for (const row of section) {
            markdown += `${row.id}: ${row.description} [${row.references}]`;
            if (row.references !== "") {
                markdown += `[${row.references}]`;
            }
            markdown += `\n\n`;
        }
        markdown += `\n`;
    }
    // TODO: summarize safety constraints
    markdown += "## Summarized Safety Constraints\n\n";
    return markdown;
}


