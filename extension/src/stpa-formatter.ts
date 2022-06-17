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

import { CancellationToken, DocumentFormattingEditProvider, FormattingOptions, Position, ProviderResult, Range, TextDocument, TextEdit } from "vscode";

export class StpaFormattingEditProvider implements DocumentFormattingEditProvider {

    provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
        const edits: TextEdit[] = [];
        const text = document.getText();
        // TODO: controlstructure and/or responsibilities may not be defined
        const headers = text.split(/(?=ControlStructure)|(?=Responsibilities)/);
        let offset = 0;
        let openParens = 0;

        let splits = headers[0].split(/(?<=])|(?<={)|(?<=})/);
        for (let i = 1; i < splits.length; i++) {
            offset += splits[i - 1].length;
            switch (splits[i - 1][splits[i - 1].length - 1]) {
                case ']':
                    break;
                case '{':
                    openParens++;
                    this.formatOpenParenthesis(offset, document, openParens, edits, splits[i]);
                    break;
                case '}':
                    openParens--;
                    break;
                default:
                    console.log("Something went wrong while splitting.");
                    break;
            }
        }
        offset += splits[splits.length - 1].length + headers[1].length;
        splits = headers[2].split(/(?<=])|(?<={)|(?<=})/);
        for (let i = 1; i < splits.length - 1; i++) {
            offset += splits[i - 1].length;
            switch (splits[i - 1][splits[i - 1].length - 1]) {
                case ']':
                    break;
                case '{':
                    openParens++;
                    // TODO: case that nothing is written in the parenthesis -> could be handled in closing case
                    this.formatOpenParenthesis(offset, document, openParens, edits, splits[i]);
                    break;
                case '}':
                    openParens--;
                    break;
                default:
                    console.log("Something went wrong while splitting.");
                    break;
            }
        }


        return edits;
    }

    protected formatOpenParenthesis(offset: number, document: TextDocument, openParens: number, edits: TextEdit[], split: string) {
        let nextChar = 0;
        while (split[nextChar] === ' ') {
            nextChar++;
        }
        const startPos = document.positionAt(offset);
        const endPos = document.positionAt(offset + nextChar);
        const delRange = new Range(startPos, endPos);
        edits.push(TextEdit.delete(delRange));
        let whiteSpaces = 0;
        let addOffset = 0;
        if (split[nextChar] === '\r') {
            while (split[nextChar + 2 + whiteSpaces] === ' ') {
                whiteSpaces++;
            }
            addOffset += 2;
        } else {
            const pos: Position = document.positionAt(offset + nextChar);
            // IMPORTANT: "\r\n" is specific to windows, linux just uses "\n"
            edits.push(TextEdit.insert(pos, '\r\n'));
        }

        let insertWhiteSpaces = '';
        while (whiteSpaces < 4 * openParens) {
            insertWhiteSpaces += ' ';
            whiteSpaces++;
        }
        const pos: Position = document.positionAt(offset + nextChar + addOffset);
        edits.push(TextEdit.insert(pos, insertWhiteSpaces));
    }

}