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
var inversify_1 = require("inversify");
var messages_1 = require("vscode-jsonrpc/lib/common/messages");
var vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
var vscode_api_1 = require("../../vscode-api");
var LanguageClientProxy = /** @class */ (function () {
    function LanguageClientProxy() {
        var _this = this;
        this.currentNumber = 0;
        this.openRequestsResolves = new Map();
        this.openRequestsRejects = new Map();
        window.addEventListener('message', function (message) {
            if ('data' in message && messages_1.isResponseMessage(message.data)) {
                var id = message.data.id;
                if (typeof id === 'number') {
                    if (message.data.error) {
                        var reject = _this.openRequestsRejects.get(id);
                        if (reject)
                            reject(message.data.error);
                    }
                    else {
                        var resolve = _this.openRequestsResolves.get(id);
                        if (resolve)
                            resolve(message.data.result);
                    }
                    _this.openRequestsResolves.delete(id);
                    _this.openRequestsRejects.delete(id);
                }
            }
        });
    }
    LanguageClientProxy.prototype.sendRequest = function (type) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                if (vscode_languageserver_protocol_1.CancellationToken.is(params[params.length - 1]))
                    params.pop();
                vscode_api_1.vscodeApi.postMessage({
                    method: type.method,
                    id: this.currentNumber,
                    jsonrpc: 'request',
                    params: params[0]
                });
                promise = new Promise(function (resolve, reject) {
                    _this.openRequestsResolves.set(_this.currentNumber, resolve);
                    _this.openRequestsRejects.set(_this.currentNumber, reject);
                });
                ++this.currentNumber;
                return [2 /*return*/, promise];
            });
        });
    };
    LanguageClientProxy.prototype.sendNotification = function (type, params) {
        vscode_api_1.vscodeApi.postMessage({
            method: type.method,
            jsonrpc: 'notify',
            params: params
        });
    };
    LanguageClientProxy = __decorate([
        inversify_1.injectable(),
        __metadata("design:paramtypes", [])
    ], LanguageClientProxy);
    return LanguageClientProxy;
}());
exports.LanguageClientProxy = LanguageClientProxy;
//# sourceMappingURL=language-client-proxy.js.map