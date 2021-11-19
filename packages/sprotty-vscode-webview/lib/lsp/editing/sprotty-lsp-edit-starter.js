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
var sprotty_1 = require("sprotty");
var root_popup_model_provider_1 = require("../../root-popup-model-provider");
var code_action_popup_palette_1 = require("./code-action-popup-palette");
var code_action_provider_1 = require("./code-action-provider");
var edit_diagram_locker_1 = require("./edit-diagram-locker");
var language_client_proxy_1 = require("./language-client-proxy");
var sprotty_starter_1 = require("../../sprotty-starter");
var vscode_diagram_server_1 = require("../../vscode-diagram-server");
var vscode_lsp_edit_diagram_server_1 = require("./vscode-lsp-edit-diagram-server");
var delete_with_workspace_edit_1 = require("./delete-with-workspace-edit");
var SprottyLspEditStarter = /** @class */ (function (_super) {
    __extends(SprottyLspEditStarter, _super);
    function SprottyLspEditStarter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SprottyLspEditStarter.prototype.addVscodeBindings = function (container, diagramIdentifier) {
        _super.prototype.addVscodeBindings.call(this, container, diagramIdentifier);
        container.rebind(vscode_diagram_server_1.VscodeDiagramServer).to(vscode_lsp_edit_diagram_server_1.VscodeLspEditDiagramServer);
        container.bind(edit_diagram_locker_1.EditDiagramLocker).toSelf().inSingletonScope();
        container.rebind(sprotty_1.TYPES.IDiagramLocker).toService(edit_diagram_locker_1.EditDiagramLocker);
        container.bind(language_client_proxy_1.LanguageClientProxy).toSelf().inSingletonScope();
        container.bind(code_action_provider_1.CodeActionProvider).toSelf().inSingletonScope();
        container.bind(code_action_popup_palette_1.CodeActionPopupPaletteProvider).toSelf().inSingletonScope();
        container.bind(root_popup_model_provider_1.IRootPopupModelProvider).toService(code_action_popup_palette_1.CodeActionPopupPaletteProvider);
        container.bind(code_action_popup_palette_1.PaletteMouseListener).toSelf().inSingletonScope();
        container.rebind(sprotty_1.TYPES.PopupMouseListener).to(code_action_popup_palette_1.PaletteMouseListener);
        sprotty_1.configureCommand(container, sprotty_1.CreateElementCommand);
        sprotty_1.configureCommand(container, delete_with_workspace_edit_1.DeleteWithWorkspaceEditCommand);
    };
    return SprottyLspEditStarter;
}(sprotty_starter_1.SprottyStarter));
exports.SprottyLspEditStarter = SprottyLspEditStarter;
//# sourceMappingURL=sprotty-lsp-edit-starter.js.map