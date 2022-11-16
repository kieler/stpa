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

import { Reference, ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { Position } from 'vscode-languageserver-types';
import {
    ContConstraint, Hazard, HazardList, Loss, Model, Node,
    Responsibility, StpaAstType, SystemConstraint, LossScenario, UCA, SafetyConstraint, Variable, Graph, Command, isModel, Context, Rule
} from './generated/ast';
import { StpaServices } from './stpa-module';
import { collectElementsWithSubComps } from './utils';

/**
 * Map AST node types to validation checks.
 */
type StpaChecks = { [type in StpaAstType]?: ValidationCheck | ValidationCheck[] };

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
            Node: validator.checkNode,
            Context: validator.checkContext
        };
        this.register(checks, validator);
    }
}

type elementWithName = Loss | Hazard | SystemConstraint | Responsibility | UCA | ContConstraint | LossScenario | SafetyConstraint | Node | Variable | Graph | Command | Context;
type elementWithRefs = Hazard | SystemConstraint | Responsibility | HazardList | ContConstraint;

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
        this.checkAllAspectsPresent(model, accept);

        const hazards = collectElementsWithSubComps(model.hazards) as Hazard[];
        const sysCons = collectElementsWithSubComps(model.systemLevelConstraints) as SystemConstraint[];
        const responsibilities = model.responsibilities?.map(r => r.responsiblitiesForOneSystem).flat(1);
        const ucas = model.allUCAs?.map(sysUCA => sysUCA.ucas).flat(1);
        const contexts = model.rules?.map(rule => rule.contexts).flat(1);

        // collect elements that have an identifier and should be referenced
        let allElements: elementWithName[] = [
            ...model.losses,
            ...hazards,
            ...sysCons,
            ...ucas,
            ...contexts
        ];

        // collect all elements that have a reference list
        let elementsWithRefs: elementWithRefs[] = [
            ...hazards,
            ...sysCons,
            ...responsibilities,
            ...ucas.map(uca => uca.list),
            ...contexts.map(context => context.list),
            ...model.controllerConstraints,
            ...model.scenarios.map(scenario => scenario.list)
        ];
        // get all reference names
        const references = this.collectReferences(elementsWithRefs);
        // check if all elements are referenced at least once
        for (const node of allElements) {
            if (!references.has(node.name)) {
                accept('warning', 'This element is referenced nowhere', { node: node, property: 'name' });
            }
        }

        // add missing elements that have an ID to check uniques of all IDs
        allElements = allElements.concat(responsibilities, model.controllerConstraints, model.scenarios, model.safetyCons, model.controlStructure?.nodes/*, model.controlStructure?.edges*/);
        this.checkIDsAreUnique(allElements, accept);
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
                accept('error', 'This variable has an invalid value.', { node: context, range: variable.$refNode.range });
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
        if (!model.allUCAs || model.allUCAs?.length === 0) {
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
     * @param allElements All Elements with a reference list.
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
