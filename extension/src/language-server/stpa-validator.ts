import { ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { StpaAstType, Person } from './generated/ast';
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
            Person: validator.checkPersonStartsWithCapital
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class StpaValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}
