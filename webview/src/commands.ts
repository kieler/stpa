import { Command, CommandExecutionContext, CommandReturn, TYPES } from "sprotty";
import { injectable, inject } from 'inversify'
import { Action } from 'sprotty-protocol'
import { Options } from "./options";

export interface ColorToggleAction extends Action {
    kind: typeof ColorToggleAction.KIND
}
export namespace ColorToggleAction {
    export const KIND = 'color';

    export function is(action: Action): action is ColorToggleAction {
        return action.kind === KIND;
    }
}

@injectable()
export class ColorToggleCommand extends Command {
    static readonly KIND = ColorToggleAction.KIND;

    @inject(Options) protected readonly options: Options

    constructor(@inject(TYPES.Action) readonly action: ColorToggleAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.options.toggleColored()
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

@injectable()
export class FormToggleCommand extends Command {
    static readonly KIND = FormToggleAction.KIND;

    @inject(Options) protected readonly options: Options

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

export interface PrintStyleToggleAction extends Action {
    kind: typeof PrintStyleToggleAction.KIND
}
export namespace PrintStyleToggleAction {
    export const KIND = 'printStyle';

    export function is(action: Action): action is PrintStyleToggleAction {
        return action.kind === KIND;
    }
}

@injectable()
export class PrintStyleToggleCommand extends Command {
    static readonly KIND = PrintStyleToggleAction.KIND;

    @inject(Options) protected readonly options: Options

    constructor(@inject(TYPES.Action) readonly action: PrintStyleToggleAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        this.options.togglePrintStyle()
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}