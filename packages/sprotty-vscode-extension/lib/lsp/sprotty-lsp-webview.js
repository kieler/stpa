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
exports.SprottyLspWebview = void 0;
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
var sprotty_vscode_protocol_1 = require("sprotty-vscode-protocol");
var messages_1 = require("vscode-jsonrpc/lib/common/messages");
var protocol_1 = require("./protocol");
var sprotty_lsp_vscode_extension_1 = require("./sprotty-lsp-vscode-extension");
var sprotty_webview_1 = require("../sprotty-webview");
var SprottyLspWebview = /** @class */ (function (_super) {
    __extends(SprottyLspWebview, _super);
    function SprottyLspWebview(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        if (!(options.extension instanceof sprotty_lsp_vscode_extension_1.SprottyLspVscodeExtension))
            throw new Error('SprottyLspWebview must be initialized with a SprottyLspVscodeExtension');
        return _this;
    }
    SprottyLspWebview.prototype.ready = function () {
        return Promise.all([_super.prototype.ready.call(this), this.languageClient.onReady()]);
    };
    Object.defineProperty(SprottyLspWebview.prototype, "languageClient", {
        get: function () {
            return this.extension.languageClient;
        },
        enumerable: false,
        configurable: true
    });
    SprottyLspWebview.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _super.prototype.connect.call(this);
                this.languageClient.onReady().then(function () {
                    _this.disposables.push(_this.extension.onAcceptFromLanguageServer(function (message) { return _this.sendToWebview(message); }));
                });
                return [2 /*return*/];
            });
        });
    };
    SprottyLspWebview.prototype.receiveFromWebview = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var shouldPropagate, result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, _super.prototype.receiveFromWebview.call(this, message)];
                    case 1:
                        shouldPropagate = _b.sent();
                        if (!shouldPropagate) return [3 /*break*/, 8];
                        if (!sprotty_vscode_protocol_1.isActionMessage(message)) return [3 /*break*/, 2];
                        this.languageClient.sendNotification(protocol_1.acceptMessageType, message);
                        return [3 /*break*/, 8];
                    case 2:
                        if (!messages_1.isRequestMessage(message)) return [3 /*break*/, 7];
                        if (!(message.params)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.languageClient.sendRequest(message.method, message.params)];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.languageClient.sendRequest(message.method)];
                    case 5:
                        _a = _b.sent();
                        _b.label = 6;
                    case 6:
                        result = _a;
                        this.sendToWebview({
                            jsonrpc: 'response',
                            id: message.id,
                            result: result
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        if (messages_1.isNotificationMessage(message)) {
                            this.languageClient.sendNotification(message.method, message.params);
                        }
                        _b.label = 8;
                    case 8: return [2 /*return*/, false];
                }
            });
        });
    };
    SprottyLspWebview.viewCount = 0;
    return SprottyLspWebview;
}(sprotty_webview_1.SprottyWebview));
exports.SprottyLspWebview = SprottyLspWebview;
//# sourceMappingURL=sprotty-lsp-webview.js.map