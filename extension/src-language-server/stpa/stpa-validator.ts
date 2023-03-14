/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { Reference, ValidationAcceptor, ValidationChecks, ValidationRegistry } from 'langium';
import { Position } from 'vscode-languageserver-types';
import { StpaAstType, Loss, Hazard, Command, SystemConstraint, Node, Responsibility, UCA, ContConstraint, LossScenario, SafetyConstraint, Variable, Graph, Context, HazardList, Model, isModel, Rule } from '../generated/ast';
import { StpaServices } from './stpa-module';
import { collectElementsWithSubComps } from './utils';

/**
 * Registry for validation checks.
 */
export class StpaValidationRegistry extends ValidationRegistry {
    constructor(services: StpaServices) {
        super(services);
        const validator = services.validation.StpaValidator;
        const checks: ValidationChecks<StpaAstType> = {
            Model: validator.checkModel,
            Hazard: validator.checkHazard,
            SystemConstraint: validator.checkSystemConstraint,
            Responsibility: validator.checkResponsibility,
            ContConstraint: validator.checkControllerConstraints,
            HazardList: validator.checkHazardList,
            Node: validator.checkNode,
            Context: validator.checkContext
        };
        this.register(checks, validator);
    }
}

export type elementWithName = Loss | Hazard | SystemConstraint | Responsibility | UCA | ContConstraint | LossScenario | SafetyConstraint | Node | Variable | Graph | Command | Context | Rule;
export type elementWithRefs = Hazard | SystemConstraint | Responsibility | HazardList | ContConstraint | SafetyConstraint;

/**
 * Implementation of custom validations.
 */
export class StpaValidator {

    /** Boolean option to toggle the check whether all system-level constraints are covered by a responsibility. */
    checkResponsibilitiesForConstraints = true;

    /** Boolean option to toggle the check whether all UCAs are covered by constraints. */
    checkConstraintsForUCAs = true;

    /** Boolean option to toggle the check whether all UCAs are covered by scenarios. */
    checkScenariosForUCAs = true;

    /** Boolean option to toggle the check whether all UCAs are covered by safety requirements. */
    checkSafetyRequirementsForUCAs = true;

    /**
     * Executes validation checks for the whole model.
     * @param model The model to validate.
     * @param accept 
     */
    checkModel(model: Model, accept: ValidationAcceptor): void {
        this.checkAllAspectsPresent(model, accept);

        const hazards = collectElementsWithSubComps(model.hazards) as Hazard[];
        const sysCons = collectElementsWithSubComps(model.systemLevelConstraints) as SystemConstraint[];
        const responsibilities = model.responsibilities?.map(r => r.responsiblitiesForOneSystem).flat(1);
        const ucas = model.allUCAs?.map(sysUCA => sysUCA.ucas).flat(1);
        const contexts = model.rules?.map(rule => rule.contexts).flat(1);

        // collect all elements that have a reference list
        let elementsWithRefs: elementWithRefs[] = [
            ...hazards,
            ...sysCons,
            ...ucas.map(uca => uca.list),
            ...contexts.map(context => context.list)
        ];

        // collect nodes that should be checked whether they are referenced
        let nodesToCheck: elementWithName[] = [...model.losses, ...hazards];
        if (this.checkResponsibilitiesForConstraints) {
            nodesToCheck.push(...sysCons);
            elementsWithRefs.push(...responsibilities);
        }
        // get all reference names
        const references = this.collectReferences(elementsWithRefs);
        // check if all elements are referenced at least once
        for (const node of nodesToCheck) {
            if (!references.has(node.name)) {
                accept('warning', 'This element is not referenced', { node: node, property: 'name' });
            }
        }

        //check referenced UCAs
        elementsWithRefs = [];
        // get referenced ucas from the different aspects
        let constraintsRefs = new Set<string>();
        let scenarioRefs: (string | undefined)[] = [];
        let safetyRequirementsRefs = new Set<string>();
        if (this.checkConstraintsForUCAs) {
            constraintsRefs = this.collectReferences(model.controllerConstraints);
        }
        if (this.checkScenariosForUCAs) {
            scenarioRefs = model.scenarios.map(scenario => scenario.uca?.ref?.name);
        }
        if (this.checkSafetyRequirementsForUCAs) {
            safetyRequirementsRefs = this.collectReferences(model.safetyCons);
        }
        // check if ucas are referenced by the other aspects
        nodesToCheck = [...ucas, ...contexts];
        for (const node of nodesToCheck) {
            if (this.checkConstraintsForUCAs && !constraintsRefs.has(node.name)) {
                accept('warning', 'This element is not referenced by a constraint', { node: node, property: 'name' });
            }
            if (this.checkScenariosForUCAs && !scenarioRefs.includes(node.name)) {
                accept('warning', 'This element is not referenced by a scenario', { node: node, property: 'name' });
            }
            if (this.checkSafetyRequirementsForUCAs && !safetyRequirementsRefs.has(node.name)) {
                accept('warning', 'This element is not referenced by a safety requirement', { node: node, property: 'name' });
            }
        }

        // collect elements that have an identifier and should be referenced
        let allElements: elementWithName[] = [
            ...model.losses,
            ...hazards,
            ...sysCons,
            ...ucas,
            ...contexts,
            ...responsibilities,
            ...model.controllerConstraints,
            ...model.scenarios,
            ...model.safetyCons
        ];
        if (model.controlStructure) {
            allElements.push(model.controlStructure);
        }
        //check that their IDs are unique
        this.checkIDsAreUnique(allElements, accept);


        // check that each control action has at least one UCA
        const ucaActions = [...model.allUCAs.map(alluca => alluca.system.ref?.name + "." + alluca.action.ref?.name), ...model.rules.map(rule => rule.system.ref?.name + "." + rule.action.ref?.name)];
        model.controlStructure?.nodes.forEach(node => node.actions.forEach(action => action.comms.forEach(command => {
            const name = node.name + "." + command.name;
            if (!ucaActions.includes(name)) {
                accept('warning', 'This element is not referenced by a UCA', { node: command, property: 'name' });
            }
        })));
    }

    /**
     * Validates the variable values of {@code context}.
     * @param context The Context to check.
     * @param accept 
     */
    checkContext(context: Context, accept: ValidationAcceptor): void {
        for (let i = 0; i < context.vars.length; i++) {
            const variable = context.vars[i];
            const variableValues = variable.ref?.values;
            // the value of the variable in the context should be one of the values that are stated in the definition of the variable
            if (!variableValues?.includes(context.values[i])) {
                accept('error', 'This variable has an invalid value.', { node: context, range: variable.$refNode?.range });
            }
        }
    }

    /**
     * Executes validation checks for a hazard.
     * @param hazard The Hazard to check.
     * @param accept 
     */
    checkHazard(hazard: Hazard, accept: ValidationAcceptor): void {
        if (hazard.subComps) {
            this.checkPrefixOfSubElements(hazard.name, hazard.subComps, accept);
            this.checkReferencedLossesOfSubHazard(hazard.refs, hazard.subComps, accept);
        }
        this.checkReferenceListForDuplicates(hazard, hazard.refs, accept);
        // a top-level hazard should reference loss(es)
        if (isModel(hazard.$container) && hazard.refs.length === 0) {
            const range = hazard.$cstNode?.range;
            if (range) {
                range.start.character = range.end.character - 1;
            }
            accept('warning', 'A hazard should reference loss(es)', { node: hazard, range: range });
        }
    }

    /**
     * Executes validation checks for a system-level constraint.
     * @param sysCons The SystemConstraint to check.
     * @param accept 
     */
    checkSystemConstraint(sysCons: SystemConstraint, accept: ValidationAcceptor): void {
        if (sysCons.subComps) {
            this.checkPrefixOfSubElements(sysCons.name, sysCons.subComps, accept);
        }
        this.checkReferenceListForDuplicates(sysCons, sysCons.refs, accept);
    }

    /**
     * Executes validation checks for a responsibility.
     * @param resp The responsibility to check.
     * @param accept 
     */
    checkResponsibility(resp: Responsibility, accept: ValidationAcceptor): void {
        this.checkReferenceListForDuplicates(resp, resp.refs, accept);
    }

    /**
     * Executes validation checks for a node of the control structure.
     * @param node The node to check.
     * @param accept 
     */
    checkNode(node: Node, accept: ValidationAcceptor): void {
        this.checkIDsAreUnique(node.variables, accept);
        this.checkIDsAreUnique(node.actions.map(ve => ve.comms).flat(1), accept);
        this.checkIDsAreUnique(node.feedbacks.map(ve => ve.comms).flat(1), accept);
    }

    /**
     * Executes validation checks for a controller constraint.
     * @param contCons The ContConstraint to check.
     * @param accept 
     */
    checkControllerConstraints(contCons: ContConstraint, accept: ValidationAcceptor): void {
        this.checkReferenceListForDuplicates(contCons, contCons.refs, accept);
    }

    /**
     * Executes validation checks for a hazard list.
     * @param hazardList The HazardList to check.
     * @param accept 
     */
    checkHazardList(hazardList: HazardList, accept: ValidationAcceptor): void {
        this.checkReferenceListForDuplicates(hazardList, hazardList.refs, accept);
    }

    /**
     * Controls whether the ids of the given elements are unique.
     * @param allElements The elements which IDs should be checked.
     * @param accept 
     */
    private checkIDsAreUnique(allElements: elementWithName[], accept: ValidationAcceptor): void {
        const names = new Set();
        for (const node of allElements) {
            let name = node?.name;
            if (name !== "") {
                if (names.has(name)) {
                    accept('error', 'All identifiers must be unique.', { node: node, property: 'name' });
                } else {
                    names.add(name);
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
        let lineCount = model.$document?.textDocument.lineCount;
        if (lineCount === undefined) {
            lineCount = 0;
        }
        const start: Position = { line: lineCount, character: 0 };
        const end: Position = { line: lineCount + 1, character: 0 };
        let text = "The following aspects are missing:\n";
        let missing = false;

        // check which aspects of STPA are not defined
        if (!model.losses || model.losses?.length === 0) {
            text += "Losses\n";
            missing = true;
        }
        if (!model.hazards || model.hazards?.length === 0) {
            text += "Hazards\n";
            missing = true;
        }
        if (!model.systemLevelConstraints || model.systemLevelConstraints?.length === 0) {
            text += "SystemConstraints\n";
            missing = true;
        }
        if (!model.controlStructure || model.controlStructure?.nodes?.length === 0) {
            text += "ControlStructure\n";
            missing = true;
        }
        if (!model.responsibilities || model.responsibilities?.length === 0) {
            text += "Responsibilities\n";
            missing = true;
        }
        if ((!model.allUCAs || model.allUCAs?.length === 0) && (!model.rules || model.rules?.length === 0)) {
            text += "UCAs\n";
            missing = true;
        }
        if (!model.controllerConstraints || model.controllerConstraints?.length === 0) {
            text += "ControllerConstraints\n";
            missing = true;
        }
        if (!model.scenarios || model.scenarios?.length === 0) {
            text += "LossScenarios\n";
            missing = true;
        }
        if (!model.safetyCons || model.safetyCons?.length === 0) {
            text += "SafetyRequirements\n";
            missing = true;
        }
        if (missing) {
            accept('info', text, { node: model, range: { start: start, end: end } });
        }
    }

    /**
     * Checks whether IDs are mentioned more than once in a reference list.
     * @param main The AstNode containing the {@code list}.
     * @param list The list of the references to check.
     * @param accept 
     */
    private checkReferenceListForDuplicates(main: elementWithRefs, list: Reference<elementWithName>[], accept: ValidationAcceptor): void {
        const names = new Set();
        for (let i = 0; i < list.length; i++) {
            const ref = list[i];
            const element = ref.ref;
            // needs to be checked in order to get the name
            if (element) {
                let name = element.name;
                if (name !== "") {
                    if (names.has(name)) {
                        accept('warning', 'Duplicate reference.', { node: main, property: 'refs', index: i });
                    } else {
                        names.add(name);
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
                const loss = hazard.refs[i];
                let found = false;
                const lossName = loss.ref?.name;
                for (const parentLoss of losses) {
                    const parentLossName = parentLoss.ref?.name;
                    if (lossName === parentLossName) {
                        found = true;
                    }
                }
                if (!found) {
                    accept('error', 'SubHazards are only allowed to reference losses the parent references too', { node: hazard, property: 'refs', index: i });
                }
            }
        }
    }

    /**
     * Collects all IDs that are referenced by any element.
     * @param allElements Elements which references should be collected.
     * @returns A set with all referenced IDs.
     */
    private collectReferences(allElements: elementWithRefs[]): Set<string> {
        let refs = new Set<string>();
        for (const node of allElements) {
            if (node) {
                for (const ref of node.refs) {
                    if (ref.ref) {
                        refs.add(ref.ref?.name);
                    }
                }
            }
        }
        return refs;
    }

}
