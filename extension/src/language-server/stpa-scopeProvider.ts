import { DefaultScopeProvider } from "langium";
import { StpaServices } from "./stpa-module";


export class STPAScopeProvider extends DefaultScopeProvider {

    constructor(services: StpaServices) {
        super(services);
    }

}