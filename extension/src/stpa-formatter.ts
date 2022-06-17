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

        let splits = headers[0].split(/(?<={)|(?<=})|(?<=\n)/);
        offset = this.format(offset, document, openParens, edits, splits);

        offset += splits[splits.length - 1].length + headers[1].length;
        splits = headers[2].split(/(?<={)|(?<=})|(?<=\n)/);
        this.format(offset, document, openParens, edits, splits);

        return edits;
    }

    protected format(offset: number, document: TextDocument, openParens: number, edits: TextEdit[], splits: string[]): number {
        for (let i = 1; i < splits.length; i++) {
            offset += splits[i - 1].length;
            switch (splits[i - 1][splits[i - 1].length - 1]) {
                case '\n':
                    this.formatIndentation(offset, document, openParens, edits, splits[i]);
                    break;
                case ']':
                    break;
                case '{':
                    openParens++;
                    // TODO: case that nothing is written in the parenthesis -> could be handled in closing case
                    this.formatOpenParenthesis(offset, document, openParens, edits, splits[i]);
                    break;
                case '}':
                    this.formatClosingParenthesis(offset, document, openParens, edits, splits[i - 1]);
                    openParens--;
                    break;
                default:
                    console.log("Something went wrong while splitting.");
                    break;
            }
        }
        return offset;
    }

    protected formatIndentation(offset: number, document: TextDocument, openParens: number, edits: TextEdit[], split: string) {
        let whiteSpaces = 0;
        while (split[whiteSpaces] === ' ') {
            whiteSpaces++;
        }
        if (split[whiteSpaces] === '}') {
            openParens--;
        }
        // insert whitespaces
        if (whiteSpaces < 4 * openParens) {
            let insertWhiteSpaces = '';
            while (whiteSpaces < 4 * openParens) {
                insertWhiteSpaces += ' ';
                whiteSpaces++;
            }
            const pos: Position = document.positionAt(offset);
            edits.push(TextEdit.insert(pos, insertWhiteSpaces));
        }
        // delete whitespaces
        if (whiteSpaces > 4 * openParens) {
            let deleteWhiteSpaces = 0;
            while (whiteSpaces > 4 * openParens) {
                deleteWhiteSpaces++;
                whiteSpaces--;
            }
            const startPos = document.positionAt(offset);
            const endPos = document.positionAt(offset + deleteWhiteSpaces);
            const delRange = new Range(startPos, endPos);
            edits.push(TextEdit.delete(delRange));
        }
    }

    protected formatClosingParenthesis(offset: number, document: TextDocument, openParens: number, edits: TextEdit[], split: string) {
        let trimmed = split.trim();
        if (trimmed !== '}') {
            const newOffset = offset-1;
            const pos: Position = document.positionAt(newOffset);
            // IMPORTANT: "\r\n" is specific to windows, linux just uses "\n"
            edits.push(TextEdit.insert(pos, '\r\n'));
            this.formatIndentation(newOffset+1, document, openParens, edits, split.substring(split.indexOf('}')));
        }
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
        if (split[nextChar] !== '\r') {
            const pos: Position = document.positionAt(offset);
            // IMPORTANT: "\r\n" is specific to windows, linux just uses "\n"
            edits.push(TextEdit.insert(pos, '\r\n'));
            this.formatIndentation(offset + nextChar, document, openParens, edits, split.substring(nextChar));
        }
    }

}