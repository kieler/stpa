
import { Reference, ValidationAcceptor, ValidationChecks, ValidationRegistry } from 'langium';
import { StpaAstType, Model, Component, Gate, TopEvent} from '../generated/ast';
import type { FtaServices } from './fta-module';


export class FtaValidationRegistry extends ValidationRegistry {
    constructor(services: FtaServices) {
        super(services);
        const validator = services.validation.FtaValidator;
        const checks: ValidationChecks<StpaAstType> = {
            Model: validator.checkModel,
        };
        this.register(checks, validator);
    }
}


export class FtaValidator {


    checkModel(model: Model, accept: ValidationAcceptor): void{
        this.checkUniqueComponents(model, accept);
    }

    checkUniqueComponents(model: Model, accept: ValidationAcceptor): void{
        const componentNames = new Set();
        model.components.forEach(c => {
            if (componentNames.has(c.name)) {
                accept('error',  `Component has non-unique name '${c.name}'.`,  {node: c, property: 'name'});
            }
            componentNames.add(c.name);
        })
    }
}
