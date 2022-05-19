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

import ElkConstructor from 'elkjs/lib/elk.bundled';
import { createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, inject, Module, PartialLangiumServices } from 'langium';
import { DefaultDiagramServerManager, DiagramActionNotification, LangiumSprottyServices, LangiumSprottySharedServices, SprottyDiagramServices, SprottySharedServices } from 'langium-sprotty';
import { DefaultElementFilter, ElkFactory, ElkLayoutEngine, IElementFilter, ILayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { StpaDiagramGenerator } from './diagram-generator';
import { StpaGeneratedModule, StpaGeneratedSharedModule } from './generated/module';
import { StpaLayoutConfigurator } from './layout-config';
import { StpaDiagramServer } from './stpa-diagramServer';
import { StpaScopeProvider } from './stpa-scopeProvider';
import { StpaValidationRegistry, StpaValidator } from './stpa-validator';
import { URI } from 'vscode-uri';
import { DiagramOptions } from 'sprotty-protocol';
import { StpaSynthesisOptions } from './options/synthesis-options';
import { StpaTemplates } from './stpa-templates';


/**
 * Declaration of custom services - add your own service classes here.
 */
export type StpaAddedServices = {
    references: {
        StpaScopeProvider: StpaScopeProvider
    },
    validation: {
        StpaValidator: StpaValidator
    },
    layout: {
        ElkFactory: ElkFactory,
        ElementFilter: IElementFilter,
        LayoutConfigurator: ILayoutConfigurator
    },
    options: {
        StpaSynthesisOptions: StpaSynthesisOptions
    },
    templates: {
        StpaTemplates: StpaTemplates
    }
};

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type StpaServices = LangiumSprottyServices & StpaAddedServices;

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const STPAModule: Module<StpaServices, PartialLangiumServices & SprottyDiagramServices & StpaAddedServices> = {
    diagram: {
        DiagramGenerator: services => new StpaDiagramGenerator(services),
        ModelLayoutEngine: services => new ElkLayoutEngine(services.layout.ElkFactory, services.layout.ElementFilter, services.layout.LayoutConfigurator) as any
    },
    references: {
        ScopeProvider: services => new StpaScopeProvider(services),
        StpaScopeProvider: services => new StpaScopeProvider(services)
    },
    validation: {
        ValidationRegistry: services => new StpaValidationRegistry(services),
        StpaValidator: () => new StpaValidator()
    },
    layout: {
        ElkFactory: () => () => new ElkConstructor({ algorithms: ['layered'] }),
        ElementFilter: () => new DefaultElementFilter,
        LayoutConfigurator: () => new StpaLayoutConfigurator
    },
    options: {
        StpaSynthesisOptions: () => new StpaSynthesisOptions()
    },
    templates: {
        StpaTemplates: services => new StpaTemplates(services)
    }
};

export const stpaDiagramServerFactory =
(services: LangiumSprottySharedServices): ((clientId: string, options?: DiagramOptions) => StpaDiagramServer) => {
    const connection = services.lsp.Connection;
    const serviceRegistry = services.ServiceRegistry;
    return (clientId, options) => {
        const sourceUri = options?.sourceUri;
        if (!sourceUri) {
            throw new Error("Missing 'sourceUri' option in request.");
        }
        const language = serviceRegistry.getServices(URI.parse(sourceUri as string)) as StpaServices;
        if (!language.diagram) {
            throw new Error(`The '${language.LanguageMetaData.languageId}' language does not support diagrams.`);
        }
        return new StpaDiagramServer(async action => {
            connection?.sendNotification(DiagramActionNotification.type, { clientId, action });
        }, language.diagram, language.options.StpaSynthesisOptions, clientId, options, connection, language.templates.StpaTemplates.getTemplates());
    };
};

/**
 * instead of the default diagram server the stpa-diagram server is sued
 */
 export const StpaSprottySharedModule: Module<LangiumSprottySharedServices, SprottySharedServices> = {
    diagram: {
        diagramServerFactory: stpaDiagramServerFactory,
        DiagramServerManager: services => new DefaultDiagramServerManager(services)
    }
};



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
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createStpaServices(context?: DefaultSharedModuleContext): { shared: LangiumSprottySharedServices, states: StpaServices} {
    const shared = inject(
        createDefaultSharedModule(context),
        StpaGeneratedSharedModule,
        StpaSprottySharedModule
    );
    const states = inject(
        createDefaultModule({shared}),
        StpaGeneratedModule,
        STPAModule,
    );
    shared.ServiceRegistry.register(states);
    return { shared, states };
}
