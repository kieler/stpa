import { Action, IContextMenuItemProvider, MenuItem, Point, PopupHoverMouseListener, RequestPopupModelAction, SButton, SButtonSchema, SModelElement, SModelElementSchema, SModelRoot, SModelRootSchema } from 'sprotty';
import { Range } from 'vscode-languageserver-protocol';
import { CodeActionProvider } from './code-action-provider';
import { EditDiagramLocker } from './edit-diagram-locker';
import { IRootPopupModelProvider } from '../../root-popup-model-provider';
/**
 * A popup-palette based on code actions.
 */
export declare class CodeActionPopupPaletteProvider implements IRootPopupModelProvider {
    codeActionProvider: CodeActionProvider;
    editDiagramLocker: EditDiagramLocker;
    getPopupModel(action: RequestPopupModelAction, rootElement: SModelRootSchema): Promise<SModelElementSchema | undefined>;
}
export interface PaletteButtonSchema extends SButtonSchema {
    codeActionKind: string;
    range: Range;
}
export declare class PaletteButton extends SButton {
    codeActionKind: string;
    range: Range;
}
export declare class PaletteMouseListener extends PopupHoverMouseListener {
    codeActionProvider: CodeActionProvider;
    mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[];
    getWorkspaceEditAction(target: PaletteButton): Promise<Action>;
}
/**
 * A command-palette based on code actions.
 */
export declare class CodeActionContextMenuProvider implements IContextMenuItemProvider {
    codeActionProvider: CodeActionProvider;
    editDiagramLocker: EditDiagramLocker;
    getItems(root: Readonly<SModelRoot>, lastMousePosition?: Point | undefined): Promise<MenuItem[]>;
}
//# sourceMappingURL=code-action-popup-palette.d.ts.map