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
exports.LspLabelEditActionHandler = void 0;
var editing_1 = require("sprotty-vscode-protocol/lib/lsp/editing");
var vscode_1 = require("vscode");
var vscode_languageclient_1 = require("vscode-languageclient");
var sprotty_lsp_vscode_extension_1 = require("../sprotty-lsp-vscode-extension");
var lsp_to_vscode_1 = require("./lsp-to-vscode");
var LspLabelEditActionHandler = /** @class */ (function () {
    function LspLabelEditActionHandler(webview) {
        this.webview = webview;
        this.kind = editing_1.LspLabelEditAction.KIND;
        if (!(webview.extension instanceof sprotty_lsp_vscode_extension_1.SprottyLspVscodeExtension))
            throw new Error('LspLabelEditActionHandler must be initialized wit a SprottyLspWebview');
    }
    LspLabelEditActionHandler.prototype.handleAction = function (action) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (editing_1.LspLabelEditAction.is(action)) {
                    switch (action.editKind) {
                        case 'xref': return [2 /*return*/, this.chooseCrossReference(action)];
                        case 'name': return [2 /*return*/, this.renameElement(action)];
                    }
                }
                return [2 /*return*/, false];
            });
        });
    };
    Object.defineProperty(LspLabelEditActionHandler.prototype, "languageClient", {
        get: function () {
            return this.webview.extension.languageClient;
        },
        enumerable: false,
        configurable: true
    });
    LspLabelEditActionHandler.prototype.chooseCrossReference = function (action) {
        return __awaiter(this, void 0, void 0, function () {
            var completions, completionItems, quickPickItems, pick, pickedCompletionItem, workspaceEdit, textEdit;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.languageClient.sendRequest(vscode_languageclient_1.CompletionRequest.type, {
                            textDocument: { uri: action.location.uri },
                            position: lsp_to_vscode_1.convertPosition(action.location.range.start)
                        })];
                    case 1:
                        completions = _a.sent();
                        if (!completions) return [3 /*break*/, 3];
                        completionItems = (completions["items"])
                            ? completions.items
                            : completions;
                        quickPickItems = this.filterCompletionItems(completionItems)
                            .map(function (completionItem) {
                            return {
                                label: completionItem.textEdit.newText,
                                value: completionItem
                            };
                        });
                        return [4 /*yield*/, vscode_1.window.showQuickPick(quickPickItems)];
                    case 2:
                        pick = _a.sent();
                        if (pick) {
                            pickedCompletionItem = pick.value;
                            if (pickedCompletionItem.textEdit) {
                                workspaceEdit = new vscode_1.WorkspaceEdit();
                                textEdit = vscode_1.TextEdit.replace(lsp_to_vscode_1.convertRange(action.location.range), pickedCompletionItem.textEdit.newText);
                                workspaceEdit.set(lsp_to_vscode_1.convertUri(action.location.uri), [textEdit]);
                                return [2 /*return*/, vscode_1.workspace.applyEdit(workspaceEdit)];
                            }
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/, false];
                }
            });
        });
    };
    LspLabelEditActionHandler.prototype.filterCompletionItems = function (items) {
        return items.filter(function (item) { return item.kind === vscode_languageclient_1.CompletionItemKind.Reference; });
    };
    LspLabelEditActionHandler.prototype.renameElement = function (action) {
        return __awaiter(this, void 0, void 0, function () {
            var canRename, newName, workspaceEdit;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.languageClient.sendRequest(vscode_languageclient_1.PrepareRenameRequest.type, {
                            textDocument: {
                                uri: action.location.uri
                            },
                            position: action.location.range.start
                        })];
                    case 1:
                        canRename = _a.sent();
                        if (!canRename) return [3 /*break*/, 4];
                        return [4 /*yield*/, vscode_1.window.showInputBox({
                                prompt: 'Enter new name',
                                placeHolder: 'new name',
                                value: action.initialText
                            })];
                    case 2:
                        newName = _a.sent();
                        if (!newName) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.languageClient.sendRequest(vscode_languageclient_1.RenameRequest.type, {
                                textDocument: {
                                    uri: action.location.uri
                                },
                                position: action.location.range.start,
                                newName: newName
                            })];
                    case 3:
                        workspaceEdit = _a.sent();
                        if (workspaceEdit)
                            return [2 /*return*/, vscode_1.workspace.applyEdit(lsp_to_vscode_1.convertWorkspaceEdit(workspaceEdit))];
                        _a.label = 4;
                    case 4: return [2 /*return*/, false];
                }
            });
        });
    };
    return LspLabelEditActionHandler;
}());
exports.LspLabelEditActionHandler = LspLabelEditActionHandler;
//# sourceMappingURL=lsp-label-edit-action-handler.js.map