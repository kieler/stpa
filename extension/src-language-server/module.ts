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

import { createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, inject } from 'langium';
import { LangiumSprottySharedServices } from 'langium-sprotty';
import { StpaGeneratedModule, StpaGeneratedSharedModule } from './generated/module';
import { StpaServices, StpaSprottySharedModule, STPAModule } from './stpa/stpa-module';

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in the language module file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createServices(context: DefaultSharedModuleContext): { shared: LangiumSprottySharedServices, stpa: StpaServices; } {
    const shared = inject(
        createDefaultSharedModule(context),
        StpaGeneratedSharedModule,
        StpaSprottySharedModule
    );
    const stpa = inject(
        createDefaultModule({ shared }),
        StpaGeneratedModule,
        STPAModule,
    );
    shared.ServiceRegistry.register(stpa);
    return { shared, stpa };
}
