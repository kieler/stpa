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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SprottyLspVscodeExtension = void 0;
var vscode = require("vscode");
var vscode_languageclient_1 = require("vscode-languageclient");
var protocol_1 = require("./protocol");
var sprotty_vscode_extension_1 = require("../sprotty-vscode-extension");
var SprottyLspVscodeExtension = /** @class */ (function (_super) {
    __extends(SprottyLspVscodeExtension, _super);
    function SprottyLspVscodeExtension(extensionPrefix, context) {
        var _this = _super.call(this, extensionPrefix, context) || this;
        _this.acceptFromLanguageServerEmitter = new vscode_languageclient_1.Emitter();
        _this.languageClient = _this.activateLanguageClient(context);
        _this.languageClient.onReady().then(function () {
            _this.languageClient.onNotification(protocol_1.acceptMessageType, function (message) { return _this.acceptFromLanguageServerEmitter.fire(message); });
            _this.languageClient.onNotification(protocol_1.openInTextEditorMessageType, function (message) { return _this.openInTextEditor(message); });
        });
        return _this;
    }
    SprottyLspVscodeExtension.prototype.onAcceptFromLanguageServer = function (listener) {
        return this.acceptFromLanguageServerEmitter.event(listener);
    };
    SprottyLspVscodeExtension.prototype.didCloseWebview = function (identifier) {
        _super.prototype.didCloseWebview.call(this, identifier);
        try {
            this.languageClient.sendNotification(protocol_1.didCloseMessageType, identifier.clientId);
        }
        catch (err) {
            // Ignore the error and proceed
        }
    };
    SprottyLspVscodeExtension.prototype.deactivateLanguageClient = function () {
        if (!this.languageClient)
            return Promise.resolve(undefined);
        return this.languageClient.stop();
    };
    SprottyLspVscodeExtension.prototype.openInTextEditor = function (message) {
        var editor = vscode.window.visibleTextEditors.find(function (visibleEditor) { return visibleEditor.document.uri.toString() === message.location.uri; });
        if (editor) {
            var start = this.toPosition(message.location.range.start);
            var end = this.toPosition(message.location.range.end);
            editor.selection = new vscode.Selection(start, end);
            editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
        }
        else if (message.forceOpen) {
            vscode.window.showTextDocument(vscode.Uri.parse(message.location.uri), {
                selection: new vscode.Range(this.toPosition(message.location.range.start), this.toPosition(message.location.range.end)),
                viewColumn: vscode.ViewColumn.One
            });
        }
    };
    SprottyLspVscodeExtension.prototype.toPosition = function (p) {
        return new vscode.Position(p.line, p.character);
    };
    return SprottyLspVscodeExtension;
}(sprotty_vscode_extension_1.SprottyVscodeExtension));
exports.SprottyLspVscodeExtension = SprottyLspVscodeExtension;
//# sourceMappingURL=sprotty-lsp-vscode-extension.js.map