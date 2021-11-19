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
var sprotty_1 = require("sprotty");
/**
 * Key mappings should be provided via the vscode extensions's `package.json`.
 */
var DisabledKeyTool = /** @class */ (function (_super) {
    __extends(DisabledKeyTool, _super);
    function DisabledKeyTool() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DisabledKeyTool.prototype.decorate = function (vnode, element) {
        return vnode;
    };
    return DisabledKeyTool;
}(sprotty_1.KeyTool));
exports.DisabledKeyTool = DisabledKeyTool;
//# sourceMappingURL=disabled-keytool.js.map