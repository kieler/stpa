import { AstNode, ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { Position } from 'vscode-languageserver-types';
import { isContConstraint, isHazard, isLoss, isLossScenario, isResponsibility, isSafetyConstraint, isSystemConstraint, isUCA, Model, StpaAstType } from './generated/ast';
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
            Model: validator.checkModel
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class StpaValidator {

    checkModel(model: Model, accept: ValidationAcceptor): void {
        this.checkIDsAreUnique(model, accept)
        this.checkAllAspectsPresent(model, accept)
    }

    checkIDsAreUnique(model: Model, accept: ValidationAcceptor): void {
        const names = new Set()
        // collect all defined elements that have an identifier
        let allNodes: AstNode[] =  model.losses.concat(model.hazards, model.systemLevelConstraints)
        for (const resp of model.responsibilities) {
            allNodes = allNodes.concat(resp.responsiblitiesForOneSystem)
        }
        for (const systemUCAs of model.allUCAs) {
            allNodes = allNodes.concat(systemUCAs.ucas)
        }
        allNodes = allNodes.concat(model.controllerConstraints, model.scenarios, model.safetyCons)

        // check whether the identifiers of the elements are unique
        for (const node of allNodes) {
            if (isLoss(node)|| isHazard(node) || isSystemConstraint(node) || isContConstraint(node) || isLossScenario(node) || isSafetyConstraint(node) || isResponsibility(node) || isUCA(node)){
                let name = node.name
                if (name != "") {
                    if(names.has(name)) {
                        accept('warning', 'All identifiers should be unique.', { node: node, property: 'name' });
                    } else {
                        names.add(name)
                    }
                }
            }
        }
    }

    checkAllAspectsPresent(model: Model, accept: ValidationAcceptor): void {
        let lineCount = model.$document?.textDocument.lineCount
        if (lineCount == undefined) {
            lineCount = 0
        }
        const start: Position = {line:lineCount, character:0}
        const end: Position = {line:lineCount+1, character:0}
        if (model.responsibilities.length == 0) {
            accept('info', 'No responsibilities are defined', { node: model, range: {start: start, end: end} });
        }
        if (model.safetyCons.length == 0) {
            accept('info', 'No safety requirements are defined', { node: model, range: {start: start, end: end} });
        }
        if (model.systemLevelConstraints.length == 0) {
            accept('info', 'No system-level constraints are defined', { node: model, range: {start: start, end: end} });
        }
        if (model.controllerConstraints.length == 0) {
            accept('info', 'No controller constraints are defined', { node: model, range: {start: start, end: end} });
        }
    }

}
