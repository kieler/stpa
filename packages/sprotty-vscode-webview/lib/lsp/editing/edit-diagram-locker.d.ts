import { Action, IDiagramLocker } from 'sprotty';
/**
 * An `IDiagramLocker` for language-server based editable diagrams.
 *
 * Prevents displatching of edit actions when editing is disallowed, e.g.
 * because the LS's status is fatal.
 */
export declare class EditDiagramLocker implements IDiagramLocker {
    protected nonEditActions: string[];
    allowEdit: boolean;
    isAllowed(action: Action): boolean;
}
//# sourceMappingURL=edit-diagram-locker.d.ts.map