import { injectable } from 'inversify';

/**
 * options for the colors of the STPA graph.
 */
export enum ColorOption {
    STANDARD,
    COLORED,
    PRINT
}

/**
 * Options for the visualization of the graph.
 */
@injectable()
export class DiagramOptions {

    private color: ColorOption
    private forms: boolean

    constructor(){
        this.color = ColorOption.COLORED
        this.forms = false
    }

    // set color of the diagram
    setColor(color: ColorOption) {
        this.color = color
    }

    // toggle forms of the diagram
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
