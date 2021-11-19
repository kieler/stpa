"use strict";
/********************************************************************************
 * Copyright (c) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertUri = exports.convertPosition = exports.convertRange = exports.convertTextEdit = exports.convertWorkspaceEdit = void 0;
var vscode = require("vscode");
var lsp = require("vscode-languageclient");
function convertWorkspaceEdit(workspaceEdit) {
    var _a;
    var result = new vscode.WorkspaceEdit();
    var changes = workspaceEdit.changes;
    if (changes) {
        for (var uri in changes) {
            if (changes.hasOwnProperty(uri)) {
                var textEdits = changes[uri];
                result.set(convertUri(uri), textEdits.map(convertTextEdit));
            }
        }
    }
    (_a = workspaceEdit.documentChanges) === null || _a === void 0 ? void 0 : _a.forEach(function (documentChange) {
        if (lsp.TextDocumentEdit.is(documentChange)) {
            result.set(convertUri(documentChange.textDocument.uri), documentChange.edits.map(convertTextEdit));
        }
        else if (lsp.CreateFile.is(documentChange)) {
            result.createFile(convertUri(documentChange.uri), documentChange.options);
        }
        else if (lsp.DeleteFile.is(documentChange)) {
            result.deleteFile(convertUri(documentChange.uri), documentChange.options);
        }
        else if (lsp.RenameFile.is(documentChange)) {
            result.renameFile(convertUri(documentChange.oldUri), convertUri(documentChange.newUri), documentChange.options);
        }
    });
    return result;
}
exports.convertWorkspaceEdit = convertWorkspaceEdit;
function convertTextEdit(textEdit) {
    return new vscode.TextEdit(convertRange(textEdit.range), textEdit.newText);
}
exports.convertTextEdit = convertTextEdit;
function convertRange(range) {
    return new vscode.Range(convertPosition(range.start), convertPosition(range.end));
}
exports.convertRange = convertRange;
function convertPosition(position) {
    return new vscode.Position(position.line, position.character);
}
exports.convertPosition = convertPosition;
function convertUri(uri) {
    return vscode.Uri.parse(uri);
}
exports.convertUri = convertUri;
//# sourceMappingURL=lsp-to-vscode.js.map