"use strict";
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
/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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
var sprotty_1 = require("sprotty");
var editing_1 = require("sprotty-vscode-protocol/lib/lsp/editing");
var vscode_diagram_server_1 = require("../../vscode-diagram-server");
var traceable_1 = require("./traceable");
var VscodeLspEditDiagramServer = /** @class */ (function (_super) {
    __extends(VscodeLspEditDiagramServer, _super);
    function VscodeLspEditDiagramServer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VscodeLspEditDiagramServer.prototype.initialize = function (registry) {
        _super.prototype.initialize.call(this, registry);
        registry.register(sprotty_1.EditLabelAction.KIND, this);
        registry.register(editing_1.WorkspaceEditAction.KIND, this);
        registry.register("reconnect", this);
    };
    VscodeLspEditDiagramServer.prototype.handleLocally = function (action) {
        if (action.kind === sprotty_1.EditLabelAction.KIND) {
            var label = this.getElement(action.labelId);
            if (label && sprotty_1.getBasicType(label) === 'label' && traceable_1.isTraceable(label)) {
                var editKind = (sprotty_1.getSubType(label) === 'xref') ? 'xref' : 'name';
                this.forwardToServer({
                    kind: editing_1.LspLabelEditAction.KIND,
                    initialText: label.text,
                    location: {
                        uri: traceable_1.getURI(label).toString(),
                        range: traceable_1.getRange(label)
                    },
                    editKind: editKind
                });
                return false;
            }
        }
        return _super.prototype.handleLocally.call(this, action);
    };
    VscodeLspEditDiagramServer.prototype.getElement = function (elementId) {
        var index = new sprotty_1.SModelIndex();
        index.add(this.currentRoot);
        return index.getById(elementId);
    };
    return VscodeLspEditDiagramServer;
}(vscode_diagram_server_1.VscodeDiagramServer));
exports.VscodeLspEditDiagramServer = VscodeLspEditDiagramServer;
//# sourceMappingURL=vscode-lsp-edit-diagram-server.js.map