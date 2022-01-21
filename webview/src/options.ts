import { injectable } from 'inversify';

export enum ColorOption {
    STANDARD,
    COLORED,
    PRINT
}

@injectable()
export class Options {
    private color: ColorOption
    private forms: boolean

    constructor(){
        this.color = ColorOption.COLORED
        this.forms = false
    }

    setColor(color: ColorOption) {
        this.color = color
    }

    toggleForms() {
        this.forms = !this.forms
    }

    getColor() {
        return this.color
    }

    getForms() {
        return this.forms
    }
}
