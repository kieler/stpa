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

    /**
     * Controls whether the ids of the defined elements are unique.
     * @param model The model to control.
     * @param accept 
     */
    checkIDsAreUnique(model: Model, accept: ValidationAcceptor): void {
        const names = new Set()
        // collect all defined elements that have an identifier
        const allHazards = this.collectHazards(model)
        const allSysCons = this.collectSystemConstrainta(model)
        let allNodes: AstNode[] =  (model.losses as AstNode[]).concat(allHazards, allSysCons)
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

    /**
     * Controls whether all aspects of STPA are defined.
     * @param model The model to control.
     * @param accept 
     */
    checkAllAspectsPresent(model: Model, accept: ValidationAcceptor): void {
        // determine position of info
        let lineCount = model.$document?.textDocument.lineCount
        if (lineCount == undefined) {
            lineCount = 0
        }
        const start: Position = {line:lineCount, character:0}
        const end: Position = {line:lineCount+1, character:0}

        // check whether all aspects of STPA are defined
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


    /**
     * Collects all existing hazards.
     * @param model The model containing the hazards
     * @returns A list with the existing hazards.
     */
    private collectHazards(model: Model): AstNode[] {
        let result: AstNode[] = model.hazards
        let todo = model.hazards
        for (let i = 0; i < todo.length; i++) {
            let current = todo[i]
            if (current.subHazards) {
                result = result.concat(current.subHazards)
                todo = todo.concat(current.subHazards)
            }
        }
        return result
    }

    /**
     * Collects all existing system-level constraints.
     * @param model The model containing the constraints
     * @returns A list with the existing system constraints.
     */
    private collectSystemConstrainta(model: Model): AstNode[] {
        let result: AstNode[] = model.systemLevelConstraints
        let todo = model.systemLevelConstraints
        for (let i = 0; i < todo.length; i++) {
            let current = todo[i]
            if (current.systemSubConstraints) {
                result = result.concat(current.systemSubConstraints)
                todo = todo.concat(current.systemSubConstraints)
            }
        }
        return result
    }
}
