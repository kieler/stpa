"use strict";
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
exports.SprottyWebview = void 0;
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
var vscode = require("vscode");
var sprotty_vscode_extension_1 = require("./sprotty-vscode-extension");
var messages_1 = require("vscode-jsonrpc/lib/common/messages");
var SprottyWebview = /** @class */ (function () {
    function SprottyWebview(options) {
        var _this = this;
        this.options = options;
        this.actionHandlers = new Map();
        this.messageQueue = [];
        this.disposables = [];
        this.webviewReady = new Promise(function (resolve) { return _this.resolveWebviewReady = resolve; });
        this.extension = options.extension;
        this.diagramIdentifier = options.identifier;
        this.localResourceRoots = options.localResourceRoots;
        this.scriptUri = options.scriptUri;
        this.diagramPanel = this.createWebviewPanel();
        this.connect();
    }
    Object.defineProperty(SprottyWebview.prototype, "singleton", {
        get: function () {
            return !!this.options.singleton;
        },
        enumerable: false,
        configurable: true
    });
    SprottyWebview.prototype.ready = function () {
        return this.webviewReady;
    };
    SprottyWebview.prototype.createTitle = function () {
        if (this.diagramIdentifier.uri)
            return this.diagramIdentifier.uri.substring(this.diagramIdentifier.uri.lastIndexOf('/') + 1);
        if (this.diagramIdentifier.diagramType)
            return this.diagramIdentifier.diagramType;
        else
            return 'Diagram';
    };
    SprottyWebview.prototype.createWebviewPanel = function () {
        var title = this.createTitle();
        var diagramPanel = vscode.window.createWebviewPanel(this.diagramIdentifier.diagramType || 'diagram', title, vscode.ViewColumn.Beside, {
            localResourceRoots: this.localResourceRoots,
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.initializeWebview(diagramPanel.webview, title);
        return diagramPanel;
    };
    SprottyWebview.prototype.initializeWebview = function (webview, title) {
        webview.html = "\n            <!DOCTYPE html>\n            <html lang=\"en\">\n                <head>\n                    <meta charset=\"UTF-8\">\n                    <meta name=\"viewport\" content=\"width=device-width, height=device-height\">\n                    <title>" + title + "</title>\n                    <link\n                        rel=\"stylesheet\" href=\"https://use.fontawesome.com/releases/v5.6.3/css/all.css\"\n                        integrity=\"sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/\"\n                        crossorigin=\"anonymous\">\n                </head>\n                <body>\n                    <div id=\"" + this.diagramIdentifier.clientId + "_container\" style=\"height: 100%;\"></div>\n                    <script src=\"" + webview.asWebviewUri(this.scriptUri).toString() + "\"></script>\n                </body>\n            </html>";
    };
    SprottyWebview.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.disposables.push(this.diagramPanel.onDidChangeViewState(function (event) {
                            if (event.webviewPanel.visible) {
                                _this.messageQueue.forEach(function (message) { return _this.sendToWebview(message); });
                                _this.messageQueue = [];
                            }
                            _this.setWebviewActiveContext(event.webviewPanel.active);
                        }));
                        this.disposables.push(this.diagramPanel.onDidDispose(function () {
                            _this.extension.didCloseWebview(_this.diagramIdentifier);
                            _this.disposables.forEach(function (disposable) { return disposable.dispose(); });
                        }));
                        this.disposables.push(this.diagramPanel.webview.onDidReceiveMessage(function (message) { return _this.receiveFromWebview(message); }));
                        if (this.singleton) {
                            this.disposables.push(vscode.window.onDidChangeActiveTextEditor(function (editor) { return __awaiter(_this, void 0, void 0, function () {
                                var uri, diagramType;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!editor) return [3 /*break*/, 2];
                                            uri = editor.document.uri;
                                            return [4 /*yield*/, this.extension.getDiagramTypeForUri(uri)];
                                        case 1:
                                            diagramType = _a.sent();
                                            if (diagramType) {
                                                this.reloadContent({
                                                    diagramType: diagramType,
                                                    uri: sprotty_vscode_extension_1.serializeUri(uri),
                                                    clientId: this.diagramIdentifier.clientId
                                                });
                                            }
                                            _a.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            }); }));
                        }
                        return [4 /*yield*/, this.ready()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SprottyWebview.prototype.reloadContent = function (newId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (newId.diagramType !== this.diagramIdentifier.diagramType || newId.uri !== this.diagramIdentifier.uri) {
                    this.diagramIdentifier.diagramType = newId.diagramType;
                    this.diagramIdentifier.uri = newId.uri;
                    this.sendDiagramIdentifier();
                    this.diagramPanel.title = this.createTitle();
                }
                return [2 /*return*/];
            });
        });
    };
    SprottyWebview.prototype.setWebviewActiveContext = function (isActive) {
        vscode.commands.executeCommand('setContext', this.diagramIdentifier.diagramType + '-focused', isActive);
    };
    SprottyWebview.prototype.sendDiagramIdentifier = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ready()];
                    case 1:
                        _a.sent();
                        this.sendToWebview(this.diagramIdentifier);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @return true if the message should be propagated, e.g. to a language server
     */
    SprottyWebview.prototype.receiveFromWebview = function (message) {
        if (sprotty_vscode_protocol_1.isActionMessage(message))
            return this.accept(message.action);
        else if (sprotty_vscode_protocol_1.isWebviewReadyMessage(message)) {
            this.resolveWebviewReady();
            this.sendDiagramIdentifier();
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    };
    SprottyWebview.prototype.sendToWebview = function (message) {
        if (sprotty_vscode_protocol_1.isActionMessage(message) || sprotty_vscode_protocol_1.isDiagramIdentifier(message) || messages_1.isResponseMessage(message)) {
            if (this.diagramPanel.visible) {
                if (sprotty_vscode_protocol_1.isActionMessage(message)) {
                    var actionHandler = this.actionHandlers.get(message.action.kind);
                    if (actionHandler && !actionHandler.handleAction(message.action))
                        return;
                }
                this.diagramPanel.webview.postMessage(message);
            }
            else {
                this.messageQueue.push(message);
            }
        }
    };
    SprottyWebview.prototype.dispatch = function (action) {
        this.sendToWebview({
            clientId: this.diagramIdentifier.clientId,
            action: action
        });
    };
    SprottyWebview.prototype.accept = function (action) {
        var actionHandler = this.actionHandlers.get(action.kind);
        if (actionHandler)
            return actionHandler.handleAction(action);
        return Promise.resolve(true);
    };
    SprottyWebview.prototype.addActionHandler = function (actionHandlerConstructor) {
        var actionHandler = new actionHandlerConstructor(this);
        this.actionHandlers.set(actionHandler.kind, actionHandler);
    };
    SprottyWebview.viewCount = 0;
    return SprottyWebview;
}());
exports.SprottyWebview = SprottyWebview;
//# sourceMappingURL=sprotty-webview.js.map