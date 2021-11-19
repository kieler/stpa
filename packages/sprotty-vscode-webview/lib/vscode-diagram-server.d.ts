import { ActionHandlerRegistry, ActionMessage, DiagramServer, ServerStatusAction, RequestPopupModelAction, Action } from 'sprotty';
import { VscodeDiagramWidgetFactory } from './vscode-diagram-widget';
import { IRootPopupModelProvider } from './root-popup-model-provider';
export declare class VscodeDiagramServer extends DiagramServer {
    diagramWidgetFactory: VscodeDiagramWidgetFactory;
    protected rootPopupModelProvider: IRootPopupModelProvider;
    initialize(registry: ActionHandlerRegistry): void;
    protected sendMessage(message: ActionMessage): void;
    handleLocally(action: Action): boolean;
    protected handleServerStateAction(status: ServerStatusAction): boolean;
    handleRequestPopupModel(action: RequestPopupModelAction): boolean;
}
//# sourceMappingURL=vscode-diagram-server.d.ts.map