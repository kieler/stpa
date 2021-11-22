import { ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { Model, StpaAstType } from './generated/ast';
import { StpaServices } from './stpa-module';

/**
 * Map AST node types to validation checks.
 */
type StpaChecks = { [type in StpaAstType]?: ValidationCheck | ValidationCheck[] }

/**
 * Registry for validation checks.
 */
export class StpaValidationRegistry extends ValidationRegistry {
    constructor(services: StpaServices) {
        super(services);
        const validator = services.validation.StpaValidator;
        const checks: StpaChecks = {
            Model: validator.checkIDsAreUnique
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class StpaValidator {

    checkIDsAreUnique(model: Model, accept: ValidationAcceptor): void {
        const lossNames = new Set()
        for (let loss of model.losses) {
            const name = loss.name
            if (name != null) {
                if (lossNames.has(name)) {
                    accept('warning', 'Loss identifiers should be unique.', { node: loss, property: 'name' });
                } else {
                    lossNames.add(name)
                }
            }
        }
        const hazardNames = new Set()
        for (let hazard of model.hazards) {
            const name = hazard.name
            if (name != null) {
                if (hazardNames.has(name)) {
                    accept('warning', 'Hazard identifiers should be unique.', { node: hazard, property: 'name' });
                } else {
                    hazardNames.add(name)
                }
            }
        }
    }

}
