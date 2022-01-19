import { injectable } from 'inversify';

@injectable()
export class Options {
    private colored: boolean
    private forms: boolean
    private printStyle: boolean

    constructor(){
        this.colored = true
        this.forms = false
        this.printStyle = false
    }

    toggleColored() {
        this.colored = !this.colored
    }

    toggleForms() {
        this.forms = !this.forms
    }

    togglePrintStyle() {
        this.printStyle = !this.printStyle
    }

    getColored() {
        return this.colored
    }

    getForms() {
        return this.forms
    }

    getPrintStyle() {
        return this.printStyle
    }
}
