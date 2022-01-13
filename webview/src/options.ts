import { injectable } from 'inversify';

@injectable()
export class Options {
    private colored: boolean
    private forms: boolean

    constructor(){
        this.colored = true
        this.forms = false
    }

    toggleColored() {
        this.colored = !this.colored
    }

    toggleForms() {
        this.forms = !this.forms
    }

    getColored() {
        return this.colored
    }

    getForms() {
        return this.forms
    }
}
