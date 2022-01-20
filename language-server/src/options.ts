
export class Options {
    private hierarchy: boolean

    constructor(){
        this.hierarchy = true
    }

    toggleHierarchy() {
        this.hierarchy = !this.hierarchy
    }

    getHierarchy() {
        return this.hierarchy
    }

}
