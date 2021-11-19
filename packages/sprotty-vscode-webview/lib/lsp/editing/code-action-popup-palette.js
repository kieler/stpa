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
var sprotty_1 = require("sprotty");
var editing_1 = require("sprotty-vscode-protocol/lib/lsp/editing");
var vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
var code_action_provider_1 = require("./code-action-provider");
var edit_diagram_locker_1 = require("./edit-diagram-locker");
var traceable_1 = require("./traceable");
/**
 * A popup-palette based on code actions.
 */
var CodeActionPopupPaletteProvider = /** @class */ (function () {
    function CodeActionPopupPaletteProvider() {
    }
    CodeActionPopupPaletteProvider.prototype.getPopupModel = function (action, rootElement) {
        return __awaiter(this, void 0, void 0, function () {
            var range, codeActions, buttons_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        range = traceable_1.getRange(rootElement);
                        if (!(this.editDiagramLocker.allowEdit && range !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.codeActionProvider.getCodeActions(range, 'sprotty.create')];
                    case 1:
                        codeActions = _a.sent();
                        if (codeActions) {
                            buttons_1 = [];
                            codeActions.forEach(function (codeAction) {
                                if (vscode_languageserver_protocol_1.CodeAction.is(codeAction)) {
                                    buttons_1.push({
                                        id: codeAction.title,
                                        type: 'button:create',
                                        codeActionKind: codeAction.kind,
                                        range: range
                                    });
                                }
                            });
                            return [2 /*return*/, {
                                    id: "palette",
                                    type: "palette",
                                    classes: ['sprotty-palette'],
                                    children: buttons_1,
                                    canvasBounds: action.bounds
                                }];
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/, undefined];
                }
            });
        });
    };
    __decorate([
        inversify_1.inject(code_action_provider_1.CodeActionProvider),
        __metadata("design:type", code_action_provider_1.CodeActionProvider)
    ], CodeActionPopupPaletteProvider.prototype, "codeActionProvider", void 0);
    __decorate([
        inversify_1.inject(edit_diagram_locker_1.EditDiagramLocker),
        __metadata("design:type", edit_diagram_locker_1.EditDiagramLocker)
    ], CodeActionPopupPaletteProvider.prototype, "editDiagramLocker", void 0);
    CodeActionPopupPaletteProvider = __decorate([
        inversify_1.injectable()
    ], CodeActionPopupPaletteProvider);
    return CodeActionPopupPaletteProvider;
}());
exports.CodeActionPopupPaletteProvider = CodeActionPopupPaletteProvider;
var PaletteButton = /** @class */ (function (_super) {
    __extends(PaletteButton, _super);
    function PaletteButton() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PaletteButton;
}(sprotty_1.SButton));
exports.PaletteButton = PaletteButton;
var PaletteMouseListener = /** @class */ (function (_super) {
    __extends(PaletteMouseListener, _super);
    function PaletteMouseListener() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PaletteMouseListener.prototype.mouseDown = function (target, event) {
        if (target instanceof PaletteButton) {
            return [this.getWorkspaceEditAction(target)];
        }
        return [];
    };
    PaletteMouseListener.prototype.getWorkspaceEditAction = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var codeActions, codeActions_1, codeActions_1_1, codeAction;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.codeActionProvider.getCodeActions(target.range, target.codeActionKind)];
                    case 1:
                        codeActions = _b.sent();
                        if (codeActions) {
                            try {
                                for (codeActions_1 = __values(codeActions), codeActions_1_1 = codeActions_1.next(); !codeActions_1_1.done; codeActions_1_1 = codeActions_1.next()) {
                                    codeAction = codeActions_1_1.value;
                                    if (vscode_languageserver_protocol_1.CodeAction.is(codeAction) && codeAction.edit)
                                        return [2 /*return*/, {
                                                kind: editing_1.WorkspaceEditAction.KIND,
                                                workspaceEdit: codeAction.edit
                                            }];
                                }
                            }
                            catch (e_1_1) { e_1 = { error: e_1_1 }; }
                            finally {
                                try {
                                    if (codeActions_1_1 && !codeActions_1_1.done && (_a = codeActions_1.return)) _a.call(codeActions_1);
                                }
                                finally { if (e_1) throw e_1.error; }
                            }
                        }
                        return [2 /*return*/, new sprotty_1.SetPopupModelAction(sprotty_1.EMPTY_ROOT)];
                }
            });
        });
    };
    __decorate([
        inversify_1.inject(code_action_provider_1.CodeActionProvider),
        __metadata("design:type", code_action_provider_1.CodeActionProvider)
    ], PaletteMouseListener.prototype, "codeActionProvider", void 0);
    PaletteMouseListener = __decorate([
        inversify_1.injectable()
    ], PaletteMouseListener);
    return PaletteMouseListener;
}(sprotty_1.PopupHoverMouseListener));
exports.PaletteMouseListener = PaletteMouseListener;
/**
 * A command-palette based on code actions.
 */
var CodeActionContextMenuProvider = /** @class */ (function () {
    function CodeActionContextMenuProvider() {
    }
    CodeActionContextMenuProvider.prototype.getItems = function (root, lastMousePosition) {
        return __awaiter(this, void 0, void 0, function () {
            var items, range, codeActions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        items = [];
                        range = traceable_1.getRange(root);
                        if (!(this.editDiagramLocker.allowEdit && range !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.codeActionProvider.getCodeActions(range, 'sprotty.create')];
                    case 1:
                        codeActions = _a.sent();
                        if (codeActions) {
                            codeActions.forEach(function (codeAction) {
                                if (vscode_languageserver_protocol_1.CodeAction.is(codeAction) && codeAction.edit) {
                                    items.push({
                                        id: codeAction.title,
                                        label: codeAction.title,
                                        group: 'edit',
                                        actions: [
                                            {
                                                kind: editing_1.WorkspaceEditAction.KIND,
                                                workspaceEdit: codeAction.edit
                                            }
                                        ]
                                    });
                                }
                            });
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/, items];
                }
            });
        });
    };
    __decorate([
        inversify_1.inject(code_action_provider_1.CodeActionProvider),
        __metadata("design:type", code_action_provider_1.CodeActionProvider)
    ], CodeActionContextMenuProvider.prototype, "codeActionProvider", void 0);
    __decorate([
        inversify_1.inject(edit_diagram_locker_1.EditDiagramLocker),
        __metadata("design:type", edit_diagram_locker_1.EditDiagramLocker)
    ], CodeActionContextMenuProvider.prototype, "editDiagramLocker", void 0);
    CodeActionContextMenuProvider = __decorate([
        inversify_1.injectable()
    ], CodeActionContextMenuProvider);
    return CodeActionContextMenuProvider;
}());
exports.CodeActionContextMenuProvider = CodeActionContextMenuProvider;
//# sourceMappingURL=code-action-popup-palette.js.map