"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sprotty_1 = require("sprotty");
var sprotty_vscode_protocol_1 = require("sprotty-vscode-protocol");
var disabled_keytool_1 = require("./disabled-keytool");
var vscode_api_1 = require("./vscode-api");
var vscode_diagram_server_1 = require("./vscode-diagram-server");
var vscode_diagram_widget_1 = require("./vscode-diagram-widget");
var SprottyStarter = /** @class */ (function () {
    function SprottyStarter() {
        this.sendReadyMessage();
        this.acceptDiagramIdentifier();
    }
    SprottyStarter.prototype.sendReadyMessage = function () {
        vscode_api_1.vscodeApi.postMessage({ readyMessage: 'Sprotty Webview ready' });
    };
    SprottyStarter.prototype.acceptDiagramIdentifier = function () {
        var _this = this;
        console.log('Waiting for diagram identifier...');
        var eventListener = function (message) {
            if (sprotty_vscode_protocol_1.isDiagramIdentifier(message.data)) {
                if (_this.container) {
                    var oldIdentifier = _this.container.get(sprotty_vscode_protocol_1.SprottyDiagramIdentifier);
                    var newIdentifier = message.data;
                    oldIdentifier.diagramType = newIdentifier.diagramType;
                    oldIdentifier.uri = newIdentifier.uri;
                    var diagramWidget = _this.container.get(vscode_diagram_widget_1.VscodeDiagramWidget);
                    diagramWidget.requestModel();
                }
                else {
                    console.log("...received...", message);
                    var diagramIdentifier = message.data;
                    _this.container = _this.createContainer(diagramIdentifier);
                    _this.addVscodeBindings(_this.container, diagramIdentifier);
                    _this.container.get(vscode_diagram_widget_1.VscodeDiagramWidget);
                }
            }
        };
        window.addEventListener('message', eventListener);
    };
    SprottyStarter.prototype.addVscodeBindings = function (container, diagramIdentifier) {
        container.bind(vscode_diagram_widget_1.VscodeDiagramWidget).toSelf().inSingletonScope();
        container.bind(vscode_diagram_widget_1.VscodeDiagramWidgetFactory).toFactory(function (context) {
            return function () { return context.container.get(vscode_diagram_widget_1.VscodeDiagramWidget); };
        });
        container.bind(sprotty_vscode_protocol_1.SprottyDiagramIdentifier).toConstantValue(diagramIdentifier);
        container.bind(vscode_diagram_server_1.VscodeDiagramServer).toSelf().inSingletonScope();
        container.bind(sprotty_1.TYPES.ModelSource).toService(vscode_diagram_server_1.VscodeDiagramServer);
        container.bind(sprotty_1.DiagramServer).toService(vscode_diagram_server_1.VscodeDiagramServer);
        container.rebind(sprotty_1.KeyTool).to(disabled_keytool_1.DisabledKeyTool);
    };
    return SprottyStarter;
}());
exports.SprottyStarter = SprottyStarter;
//# sourceMappingURL=sprotty-starter.js.map