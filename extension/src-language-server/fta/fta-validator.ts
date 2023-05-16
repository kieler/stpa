
import { ValidationAcceptor, ValidationChecks, ValidationRegistry } from 'langium';
import { ModelFTA, StpaAstType } from '../generated/ast';
import type { FtaServices } from './fta-module';

/**
 * Registry for validation checks.
 */
export class FtaValidationRegistry extends ValidationRegistry {
    constructor(services: FtaServices) {
        super(services);
        const validator = services.validation.FtaValidator;
        const checks: ValidationChecks<StpaAstType> = {
            ModelFTA: validator.checkModel,
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class FtaValidator {

    /**
     * Executes validation checks for the whole model.
     * @param model The model to validate.
     * @param accept 
     */
    checkModel(model: ModelFTA, accept: ValidationAcceptor): void{
        this.checkUniqueComponents(model, accept);
        this.checkUniqueGates(model, accept);
    }
    //prevent multiple components from having the same identifier.
    checkUniqueComponents(model: ModelFTA, accept: ValidationAcceptor): void{
        const componentNames = new Set();
        model.components.forEach(c => {
            if (componentNames.has(c.name)) {
                accept('error',  `Component has non-unique name '${c.name}'.`,  {node: c, property: 'name'});
            }
            componentNames.add(c.name);
        })
    }
    //prevent multiple gates from having the same identifier.
    checkUniqueGates(model:ModelFTA, accept:ValidationAcceptor): void{
        const gateNames = new Set();
        model.gates.forEach(g => {
            if (gateNames.has(g.name)) {
                accept('error',  `Gate has non-unique name '${g.name}'.`,  {node: g, property: 'name'});
            }
            gateNames.add(g.name);
        })
    }
}
