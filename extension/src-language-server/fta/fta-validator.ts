/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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
        this.checkUniqueIdentifiers(model, accept);
    }

    /**
     * Prevent multiple components, conditions and gates from having the same identifier.
     * @param model The model to validate.
     * @param accept 
     */
    checkUniqueIdentifiers(model: ModelFTA, accept: ValidationAcceptor): void{
        const componentNames = new Set();
        model.components.forEach(c => {
            if (componentNames.has(c.name)) {
                accept('error',  `Component has non-unique name '${c.name}'.`,  {node: c, property: 'name'});
            }
            componentNames.add(c.name);
        });
        model.conditions.forEach(c => {
            if(componentNames.has(c.name)){
                accept('error',  `Condition has non-unique name '${c.name}'.`,  {node: c, property: 'name'});
            }
            componentNames.add(c.name);
        });

        const gateNames = new Set();
        model.gates.forEach(g => {
            if (gateNames.has(g.name) || componentNames.has(g.name)) {
                accept('error',  `Gate has non-unique name '${g.name}'.`,  {node: g, property: 'name'});
            }
            gateNames.add(g.name);
        });

    }

}
