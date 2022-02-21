import { Command, CommandExecutionContext, CommandReturn, TYPES } from "sprotty";
import { injectable, inject } from 'inversify'
import { Action } from 'sprotty-protocol'
import { ColorOption, DiagramOptions } from "./diagram-options";

export interface ColorfulAction extends Action {
    kind: typeof ColorfulAction.KIND
}
export namespace ColorfulAction {
    export const KIND = 'colorful';

    export function is(action: Action): action is ColorfulAction {
        return action.kind === KIND;
    }
}

/**
 * Command to set the coloring of the STPA graph to colorful.
 */
@injectable()
export class ColorfulCommand extends Command {
    static readonly KIND = ColorfulAction.KIND;

    @inject(DiagramOptions) protected readonly options: DiagramOptions

    constructor(@inject(TYPES.Action) readonly action: ColorfulAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.options.setColor(ColorOption.COLORED)
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export interface StandardColorAction extends Action {
    kind: typeof StandardColorAction.KIND
}
export namespace StandardColorAction {
    export const KIND = 'standardColor';

    export function is(action: Action): action is StandardColorAction {
        return action.kind === KIND;
    }
}

/**
 * Command to set the coloring of the STPA graph to standard.
 */
@injectable()
export class StandardColorCommand extends Command {
    static readonly KIND = StandardColorAction.KIND;

    @inject(DiagramOptions) protected readonly options: DiagramOptions

    constructor(@inject(TYPES.Action) readonly action: StandardColorAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.options.setColor(ColorOption.STANDARD)
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export interface PrintStyleAction extends Action {
    kind: typeof PrintStyleAction.KIND
}
export namespace PrintStyleAction {
    export const KIND = 'printStyle';

    export function is(action: Action): action is PrintStyleAction {
        return action.kind === KIND;
    }
}

/**
 * Command to set the coloring of the STPA graph to print-style.
 */
@injectable()
export class PrintStyleCommand extends Command {
    static readonly KIND = PrintStyleAction.KIND;

    @inject(DiagramOptions) protected readonly options: DiagramOptions

    constructor(@inject(TYPES.Action) readonly action: PrintStyleAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.options.setColor(ColorOption.PRINT)
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}

export interface FormToggleAction extends Action {
    kind: typeof FormToggleAction.KIND
}
export namespace FormToggleAction {
    export const KIND = 'forms';

    export function is(action: Action): action is FormToggleAction {
        return action.kind === KIND;
    }
}

/**
 * Command to toggle the forms of the nodes in the STPA graph.
 */
@injectable()
export class FormToggleCommand extends Command {
    static readonly KIND = FormToggleAction.KIND;

    @inject(DiagramOptions) protected readonly options: DiagramOptions

    constructor(@inject(TYPES.Action) readonly action: FormToggleAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.options.toggleForms()
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}