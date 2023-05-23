import { ValuedSynthesisOption } from "../options/option-models";

export class FtaSynthesisOptions {

    private options: ValuedSynthesisOption[];

    constructor() {
        this.options = [];
    }

    getSynthesisOptions(): ValuedSynthesisOption[] {
        return this.options;
    }

}