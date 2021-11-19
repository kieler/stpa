import { IActionDispatcher, ModelSource, ServerStatusAction, ViewerOptions } from 'sprotty';
import { SprottyDiagramIdentifier } from 'sprotty-vscode-protocol';
export declare const VscodeDiagramWidgetFactory: unique symbol;
export declare type VscodeDiagramWidgetFactory = () => VscodeDiagramWidget;
export declare abstract class VscodeDiagramWidget {
    protected statusIconDiv: HTMLDivElement;
    protected statusMessageDiv: HTMLDivElement;
    diagramIdentifier: SprottyDiagramIdentifier;
    actionDispatcher: IActionDispatcher;
    modelSource: ModelSource;
    viewerOptions: ViewerOptions;
    constructor();
    initialize(): void;
    protected initializeHtml(): void;
    protected initializeSprotty(): void;
    requestModel(): Promise<void>;
    setStatus(status: ServerStatusAction): void;
    protected removeClasses(element: Element, keep: number): void;
}
//# sourceMappingURL=vscode-diagram-widget.d.ts.map