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
exports.SprottyLspEditVscodeExtension = void 0;
var vscode = require("vscode");
var sprotty_lsp_vscode_extension_1 = require("../sprotty-lsp-vscode-extension");
var editing_1 = require("sprotty-vscode-protocol/lib/lsp/editing");
var SprottyLspEditVscodeExtension = /** @class */ (function (_super) {
    __extends(SprottyLspEditVscodeExtension, _super);
    function SprottyLspEditVscodeExtension() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SprottyLspEditVscodeExtension.prototype.registerCommands = function () {
        var _this = this;
        _super.prototype.registerCommands.call(this);
        this.context.subscriptions.push(vscode.commands.registerCommand(this.extensionPrefix + '.diagram.delete', function () {
            var commandArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                commandArgs[_i] = arguments[_i];
            }
            var activeWebview = _this.findActiveWebview();
            if (activeWebview)
                activeWebview.dispatch({
                    kind: editing_1.DeleteWithWorkspaceEditAction.KIND
                });
        }));
    };
    return SprottyLspEditVscodeExtension;
}(sprotty_lsp_vscode_extension_1.SprottyLspVscodeExtension));
exports.SprottyLspEditVscodeExtension = SprottyLspEditVscodeExtension;
//# sourceMappingURL=sprotty-lsp-edit-vscode-extension.js.map