import { AstNode, Reference, ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { Position } from 'vscode-languageserver-types';
import { ContConstraint, Hazard, HazardList, isContConstraint, isGraph, isHazard, isLoss, isLossScenario, isNode, isResponsibility, isSafetyConstraint, isSystemConstraint, isUCA, isVariable, isCommand, Loss, Model, Node, Responsibility, STPAAstType, SystemConstraint } from './generated/ast';
import { StpaServices } from './stpa-module';
import { collectElementsWithSubComps } from './utils';

/**
 * Map AST node types to validation checks.
 */
type StpaChecks = { [type in STPAAstType]?: ValidationCheck | ValidationCheck[] }

/**
 * Registry for validation checks.
 */
export class StpaValidationRegistry extends ValidationRegistry {
    constructor(services: StpaServices) {
        super(services);
        const validator = services.validation.StpaValidator;
        const checks: StpaChecks = {
            Model: validator.checkModel,
            Hazard: validator.checkHazard,
            SystemConstraint: validator.checkSystemConstraint,
            Responsibility: validator.checkResponsibility,
            ContConstraint: validator.checkControllerConstraints,
            HazardList: validator.checkHazardList,
            Node: validator.checkNode
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class StpaValidator {

    /**
     * Executes validation checks for the whole model.
     * @param model The model to validate.
     * @param accept 
     */
    checkModel(model: Model, accept: ValidationAcceptor): void {
        this.checkAllAspectsPresent(model, accept)
        // collect all defined elements that have an identifier in order to check the uniqueness
        let allNodes: AstNode[] =  [
            ...model.losses,
            ...collectElementsWithSubComps(model.hazards),
            ...collectElementsWithSubComps(model.systemLevelConstraints),
            //...model.controlStructure?.edges,
            ...model.responsibilities?.map(r => r.responsiblitiesForOneSystem).flat(1),
            ...model.allUCAs?.map(sysUCA => sysUCA.ucas).flat(1),
            ...model.controllerConstraints,
            ...model.scenarios,
            ...model.safetyCons
        ]
        // causes an error when stated with the others above
        allNodes = allNodes.concat(model.controlStructure?.nodes)
        this.checkIDsAreUnique(allNodes, accept)
    }

    /**
     * Executes validation checks for a hazard.
     * @param hazard The Hazard to check.
     * @param accept 
     */
    checkHazard(hazard: Hazard, accept: ValidationAcceptor): void {
        if (hazard.subComps) {
            this.checkPrefixOfSubElements(hazard.name, hazard.subComps, accept)
            this.checkReferencedLossesOfSubHazard(hazard.refs, hazard.subComps, accept)
        }
        this.checkReferenceListForDuplicates(hazard, hazard.refs, accept)
    }

    /**
     * Executes validation checks for a system-level constraint.
     * @param sysCons The SystemConstraint to check.
     * @param accept 
     */
    checkSystemConstraint(sysCons: SystemConstraint, accept: ValidationAcceptor): void {
        if (sysCons.subComps) {
            this.checkPrefixOfSubElements(sysCons.name, sysCons.subComps, accept)
        }
        this.checkReferenceListForDuplicates(sysCons, sysCons.refs, accept)
    }

    /**
     * Executes validation checks for a responsibility.
     * @param resp The responsibility to check.
     * @param accept 
     */
    checkResponsibility(resp: Responsibility, accept: ValidationAcceptor): void {
        this.checkReferenceListForDuplicates(resp, resp.refs, accept)
    }

    /**
     * Executes validation checks for a node of the control structure.
     * @param node The node to check.
     * @param accept 
     */
    checkNode(node: Node, accept: ValidationAcceptor): void {
        this.checkIDsAreUnique(node.variables, accept)
        this.checkIDsAreUnique(node.actions, accept)
        this.checkIDsAreUnique(node.feedbacks, accept)
    }

    /**
     * Executes validation checks for a controller constraint.
     * @param contCons The ContConstraint to check.
     * @param accept 
     */
    checkControllerConstraints(contCons: ContConstraint, accept: ValidationAcceptor): void {
        this.checkReferenceListForDuplicates(contCons, contCons.refs, accept)
    }

    /**
     * Executes validation checks for a hazard list.
     * @param hazardList The HazardList to check.
     * @param accept 
     */
    checkHazardList(hazardList: HazardList, accept: ValidationAcceptor): void {
        this.checkReferenceListForDuplicates(hazardList, hazardList.refs, accept)
    }

    /**
     * Controls whether the ids of the given elements are unique.
     * @param allNodes The elements which IDs should be checked.
     * @param accept 
     */
    private checkIDsAreUnique(allNodes: AstNode[], accept: ValidationAcceptor): void {
        const names = new Set()
        for (const node of allNodes) {
            // needs to be checked in order to get the name
            if (isLoss(node)|| isHazard(node) || isSystemConstraint(node) || isContConstraint(node) || isLossScenario(node) 
                    || isSafetyConstraint(node) || isResponsibility(node) || isUCA(node) || isNode(node) /* || isEdge(node) */ 
                    || isCommand(node) || isGraph(node) || isVariable(node)){
                let name = node.name
                if (name != "") {
                    if(names.has(name)) {
                        accept('error', 'All identifiers must be unique.', { node: node, property: 'name' });
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
    private checkAllAspectsPresent(model: Model, accept: ValidationAcceptor): void {
        // determine position of info
        let lineCount = model.$document?.textDocument.lineCount
        if (lineCount == undefined) {
            lineCount = 0
        }
        const start: Position = {line:lineCount, character:0}
        const end: Position = {line:lineCount+1, character:0}
        let text = "The following aspects are missing:\n"
        let missing = false

        // check which aspects of STPA are not defined
        if (!model.losses || model.losses?.length == 0) {
            text+="Losses\n"
            missing = true
        }
        if (!model.hazards || model.hazards?.length == 0) {
            text+="Hazards\n"
            missing = true
        }
        if (!model.systemLevelConstraints || model.systemLevelConstraints?.length == 0) {
            text+="SystemConstraints\n"
            missing = true
        }
        if (!model.controlStructure || model.controlStructure?.nodes?.length == 0) {
            text+="ControlStructure\n"
            missing = true
        }
        if (!model.responsibilities || model.responsibilities?.length == 0) {
            text+="Responsibilities\n"
            missing = true
        }
        if (!model.allUCAs || model.allUCAs?.length == 0) {
            text+="UCAs\n"
            missing = true
        }
        if (!model.controllerConstraints || model.controllerConstraints?.length == 0) {
            text+="ControllerConstraints\n"
            missing = true
        }
        if (!model.scenarios || model.scenarios?.length == 0) {
            text+="LossScenarios\n"
            missing = true
        }
        if (!model.safetyCons || model.safetyCons?.length == 0) {
            text+="SafetyRequirements\n"
            missing = true
        }
        if (missing) {
            accept('info', text, { node: model, range: {start: start, end: end} });
        }
    }

    /**
     * Checks whether IDs are mentioned more than once in a reference list.
     * @param main The AstNode containing the {@code list}.
     * @param list The list of the references to check.
     * @param accept 
     */
     private checkReferenceListForDuplicates(main: Hazard|ContConstraint|Responsibility|HazardList|SystemConstraint, list: Reference<AstNode>[], accept: ValidationAcceptor): void {
        const names = new Set()
        for (let i = 0; i < list.length; i++) {
            const ref = list[i]
            const element = ref.ref
            // needs to be checked in order to get the name
            if (isLoss(element)|| isHazard(element) || isSystemConstraint(element) || isContConstraint(element) 
                || isLossScenario(element) || isSafetyConstraint(element) || isResponsibility(element) || isUCA(element)){
                let name = element.name
                if (name != "") {
                    if(names.has(name)) {
                        accept('warning', 'Duplicate reference.', { node: main, property: 'refs', index: i});
                    } else {
                        names.add(name)
                    }
                }
            }
        }
    }

    /**
     * Checks whether subelements (subhazards or systemsubconstraints) have the name of the parent as prefix.
     * @param name The name of the parent AstNode.
     * @param subElements List of the subelements to check.
     * @param accept 
     */
    private checkPrefixOfSubElements(name: string, subElements: (Hazard | SystemConstraint)[], accept: ValidationAcceptor): void {
        for (const element of subElements) {
            if (!element.name.startsWith(name + '.')) {
                accept('warning', 'Subelements should have as prefix the name of the parent', { node: element, property: 'name' });
            }
        }
    }

    /**
     * Check whether subhazards only reference the losses the parent references too.
     * @param losses List of loss references of the main hazard.
     * @param subHazards List of the subHazards to check.
     * @param accept 
     */
    private checkReferencedLossesOfSubHazard(losses: Reference<Loss>[], subHazards: Hazard[], accept: ValidationAcceptor): void {
        for (const hazard of subHazards) {
            for (let i = 0; i < hazard.refs.length; i++) {
                const loss = hazard.refs[i]
                let found = false
                const lossName = loss.ref?.name
                for (const parentLoss of losses) {
                    const parentLossName = parentLoss.ref?.name
                    if (lossName == parentLossName) {
                        found = true
                    }
                }
                if (!found) {
                    //TODO: should be in the scope provider?
                    accept('error', 'SubHazards are only allowed to reference losses the parent references too', { node: hazard, property: 'refs', index: i });
                }
            }
        }
    }

}
