/**
 * Contains options regarding the layout of the STPA graph.
 */
export class StpaOptions {
    // true: subcomponents are contained in their parents
    // false: subcomponents have edges to their parents
    private hierarchy: boolean

    constructor(){
        this.hierarchy = true
    }

    /**
     * Toggles the hierarchy option.
     */
    toggleHierarchy() {
        this.hierarchy = !this.hierarchy
    }

    getHierarchy() {
        return this.hierarchy
    }

}
