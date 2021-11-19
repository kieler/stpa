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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeUri = exports.SprottyVscodeExtension = void 0;
var path = require("path");
var vscode = require("vscode");
var sprotty_webview_1 = require("./sprotty-webview");
var SprottyVscodeExtension = /** @class */ (function () {
    function SprottyVscodeExtension(extensionPrefix, context) {
        this.extensionPrefix = extensionPrefix;
        this.context = context;
        this.webviewMap = new Map();
        this.registerCommands();
    }
    SprottyVscodeExtension.prototype.registerCommands = function () {
        var _this = this;
        this.context.subscriptions.push(vscode.commands.registerCommand(this.extensionPrefix + '.diagram.open', function () {
            var commandArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                commandArgs[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var identifier, key, webView;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.createDiagramIdentifier(commandArgs)];
                        case 1:
                            identifier = _a.sent();
                            if (identifier) {
                                key = this.getKey(identifier);
                                webView = this.singleton || this.webviewMap.get(key);
                                if (webView) {
                                    webView.reloadContent(identifier);
                                    webView.diagramPanel.reveal(webView.diagramPanel.viewColumn);
                                }
                                else {
                                    webView = this.createWebView(identifier);
                                    this.webviewMap.set(key, webView);
                                    if (webView.singleton) {
                                        this.singleton = webView;
                                    }
                                }
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand(this.extensionPrefix + '.diagram.fit', function () {
            var activeWebview = _this.findActiveWebview();
            if (activeWebview)
                activeWebview.dispatch({
                    kind: 'fit',
                    elementIds: [],
                    animate: true
                });
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand(this.extensionPrefix + '.diagram.center', function () {
            var activeWebview = _this.findActiveWebview();
            if (activeWebview)
                activeWebview.dispatch({
                    kind: 'center',
                    elementIds: [],
                    animate: true
                });
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand(this.extensionPrefix + '.diagram.export', function () {
            var activeWebview = _this.findActiveWebview();
            if (activeWebview)
                activeWebview.dispatch({
                    kind: 'requestExportSvg'
                });
        }));
    };
    SprottyVscodeExtension.prototype.findActiveWebview = function () {
        var e_1, _a;
        try {
            for (var _b = __values(this.webviewMap.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var webview = _c.value;
                if (webview.diagramPanel.active)
                    return webview;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return undefined;
    };
    SprottyVscodeExtension.prototype.didCloseWebview = function (identifier) {
        this.webviewMap.delete(this.getKey(identifier));
        if (this.singleton) {
            this.singleton = undefined;
        }
    };
    SprottyVscodeExtension.prototype.getKey = function (identifier) {
        return JSON.stringify({
            diagramType: identifier.diagramType,
            uri: identifier.uri
        });
    };
    SprottyVscodeExtension.prototype.createDiagramIdentifier = function (commandArgs) {
        return __awaiter(this, void 0, void 0, function () {
            var uri, diagramType, clientId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getURI(commandArgs)];
                    case 1:
                        uri = _a.sent();
                        return [4 /*yield*/, this.getDiagramType(commandArgs)];
                    case 2:
                        diagramType = _a.sent();
                        if (!uri || !diagramType)
                            return [2 /*return*/, undefined];
                        clientId = diagramType + '_' + sprotty_webview_1.SprottyWebview.viewCount++;
                        return [2 /*return*/, {
                                diagramType: diagramType,
                                uri: serializeUri(uri),
                                clientId: clientId
                            }];
                }
            });
        });
    };
    SprottyVscodeExtension.prototype.getDiagramTypeForUri = function (uri) {
        return this.getDiagramType([uri]);
    };
    SprottyVscodeExtension.prototype.getURI = function (commandArgs) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (commandArgs.length > 0) {
                    if (commandArgs[0] instanceof vscode.Uri) {
                        return [2 /*return*/, commandArgs[0]];
                    }
                }
                if (vscode.window.activeTextEditor)
                    return [2 /*return*/, vscode.window.activeTextEditor.document.uri];
                return [2 /*return*/, undefined];
            });
        });
    };
    SprottyVscodeExtension.prototype.getExtensionFileUri = function () {
        var segments = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            segments[_i] = arguments[_i];
        }
        return vscode.Uri
            .file(path.join.apply(path, __spread([this.context.extensionPath], segments)));
    };
    return SprottyVscodeExtension;
}());
exports.SprottyVscodeExtension = SprottyVscodeExtension;
function serializeUri(uri) {
    var uriString = uri.toString();
    var match = uriString.match(/file:\/\/\/([a-z])%3A/i);
    if (match) {
        uriString = 'file:///' + match[1] + ':' + uriString.substring(match[0].length);
    }
    return uriString;
}
exports.serializeUri = serializeUri;
//# sourceMappingURL=sprotty-vscode-extension.js.map