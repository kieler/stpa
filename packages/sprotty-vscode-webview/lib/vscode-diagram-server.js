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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
var inversify_1 = require("inversify");
var sprotty_1 = require("sprotty");
var vscode_diagram_widget_1 = require("./vscode-diagram-widget");
var vscode_api_1 = require("./vscode-api");
var root_popup_model_provider_1 = require("./root-popup-model-provider");
var VscodeDiagramServer = /** @class */ (function (_super) {
    __extends(VscodeDiagramServer, _super);
    function VscodeDiagramServer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VscodeDiagramServer.prototype.initialize = function (registry) {
        var _this = this;
        _super.prototype.initialize.call(this, registry);
        registry.register(sprotty_1.SelectCommand.KIND, this);
        window.addEventListener('message', function (message) {
            if ('data' in message && sprotty_1.isActionMessage(message.data)) {
                _this.messageReceived(message.data);
            }
        });
    };
    VscodeDiagramServer.prototype.sendMessage = function (message) {
        vscode_api_1.vscodeApi.postMessage(message);
    };
    VscodeDiagramServer.prototype.handleLocally = function (action) {
        if (action instanceof sprotty_1.RequestPopupModelAction) {
            return this.handleRequestPopupModel(action);
        }
        else {
            return _super.prototype.handleLocally.call(this, action);
        }
    };
    VscodeDiagramServer.prototype.handleServerStateAction = function (status) {
        this.diagramWidgetFactory().setStatus(status);
        return false;
    };
    VscodeDiagramServer.prototype.handleRequestPopupModel = function (action) {
        var _this = this;
        if (this.rootPopupModelProvider && action.elementId === this.currentRoot.id) {
            this.rootPopupModelProvider.getPopupModel(action, this.currentRoot).then(function (model) {
                if (model)
                    _this.actionDispatcher.dispatch(new sprotty_1.SetPopupModelAction(model));
            });
            return false;
        }
        else {
            return true;
        }
    };
    __decorate([
        inversify_1.inject(vscode_diagram_widget_1.VscodeDiagramWidgetFactory),
        __metadata("design:type", Function)
    ], VscodeDiagramServer.prototype, "diagramWidgetFactory", void 0);
    __decorate([
        inversify_1.inject(root_popup_model_provider_1.IRootPopupModelProvider), inversify_1.optional(),
        __metadata("design:type", Object)
    ], VscodeDiagramServer.prototype, "rootPopupModelProvider", void 0);
    return VscodeDiagramServer;
}(sprotty_1.DiagramServer));
exports.VscodeDiagramServer = VscodeDiagramServer;
//# sourceMappingURL=vscode-diagram-server.js.map