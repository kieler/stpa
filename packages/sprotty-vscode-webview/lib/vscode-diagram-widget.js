"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var sprotty_vscode_protocol_1 = require("sprotty-vscode-protocol");
exports.VscodeDiagramWidgetFactory = Symbol('VscodeDiagramWidgetFactory');
var VscodeDiagramWidget = /** @class */ (function () {
    function VscodeDiagramWidget() {
    }
    VscodeDiagramWidget.prototype.initialize = function () {
        this.initializeHtml();
        this.initializeSprotty();
    };
    VscodeDiagramWidget.prototype.initializeHtml = function () {
        var containerDiv = document.getElementById(this.diagramIdentifier.clientId + '_container');
        if (containerDiv) {
            var svgContainer = document.createElement("div");
            svgContainer.id = this.viewerOptions.baseDiv;
            containerDiv.appendChild(svgContainer);
            var hiddenContainer = document.createElement("div");
            hiddenContainer.id = this.viewerOptions.hiddenDiv;
            document.body.appendChild(hiddenContainer);
            var statusDiv = document.createElement("div");
            statusDiv.setAttribute('class', 'sprotty-status');
            containerDiv.appendChild(statusDiv);
            this.statusIconDiv = document.createElement("div");
            statusDiv.appendChild(this.statusIconDiv);
            this.statusMessageDiv = document.createElement("div");
            this.statusMessageDiv.setAttribute('class', 'sprotty-status-message');
            statusDiv.appendChild(this.statusMessageDiv);
        }
    };
    VscodeDiagramWidget.prototype.initializeSprotty = function () {
        if (this.modelSource instanceof sprotty_1.DiagramServer)
            this.modelSource.clientId = this.diagramIdentifier.clientId;
        this.requestModel();
    };
    VscodeDiagramWidget.prototype.requestModel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, err_1, status_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.actionDispatcher.request(sprotty_1.RequestModelAction.create({
                                sourceUri: this.diagramIdentifier.uri,
                                diagramType: this.diagramIdentifier.diagramType
                            }))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, this.actionDispatcher.dispatch(response)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        status_1 = new sprotty_1.ServerStatusAction();
                        status_1.message = err_1 instanceof Error ? err_1.message : err_1.toString();
                        status_1.severity = 'FATAL';
                        this.setStatus(status_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    VscodeDiagramWidget.prototype.setStatus = function (status) {
        this.statusMessageDiv.textContent = status.message;
        this.removeClasses(this.statusMessageDiv, 1);
        this.statusMessageDiv.classList.add(status.severity.toLowerCase());
        this.removeClasses(this.statusIconDiv, 0);
        var classes = this.statusIconDiv.classList;
        classes.add(status.severity.toLowerCase());
        switch (status.severity) {
            case 'FATAL':
                classes.add('fa');
                classes.add('fa-times-circle');
                break;
            case 'ERROR':
                classes.add('fa');
                classes.add('fa-exclamation-circle');
                break;
            case 'WARNING':
                classes.add('fa');
                classes.add('fa-exclamation-circle');
                break;
            case 'INFO':
                classes.add('fa');
                classes.add('fa-info-circle');
                break;
        }
    };
    VscodeDiagramWidget.prototype.removeClasses = function (element, keep) {
        var classes = element.classList;
        while (classes.length > keep) {
            var item = classes.item(classes.length - 1);
            if (item)
                classes.remove(item);
        }
    };
    __decorate([
        inversify_1.inject(sprotty_vscode_protocol_1.SprottyDiagramIdentifier),
        __metadata("design:type", Object)
    ], VscodeDiagramWidget.prototype, "diagramIdentifier", void 0);
    __decorate([
        inversify_1.inject(sprotty_1.TYPES.IActionDispatcher),
        __metadata("design:type", Object)
    ], VscodeDiagramWidget.prototype, "actionDispatcher", void 0);
    __decorate([
        inversify_1.inject(sprotty_1.TYPES.ModelSource),
        __metadata("design:type", sprotty_1.ModelSource)
    ], VscodeDiagramWidget.prototype, "modelSource", void 0);
    __decorate([
        inversify_1.inject(sprotty_1.TYPES.ViewerOptions),
        __metadata("design:type", Object)
    ], VscodeDiagramWidget.prototype, "viewerOptions", void 0);
    __decorate([
        inversify_1.postConstruct(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], VscodeDiagramWidget.prototype, "initialize", null);
    VscodeDiagramWidget = __decorate([
        inversify_1.injectable(),
        __metadata("design:paramtypes", [])
    ], VscodeDiagramWidget);
    return VscodeDiagramWidget;
}());
exports.VscodeDiagramWidget = VscodeDiagramWidget;
//# sourceMappingURL=vscode-diagram-widget.js.map