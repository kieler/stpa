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

import ElkConstructor from 'elkjs/lib/elk.bundled';
import { Module, PartialLangiumServices } from 'langium';
import { DefaultDiagramServerManager, DiagramActionNotification, LangiumSprottyServices, LangiumSprottySharedServices, SprottyDiagramServices, SprottySharedServices } from 'langium-sprotty';
import { DefaultElementFilter, ElkFactory, ElkLayoutEngine, IElementFilter, ILayoutConfigurator } from 'sprotty-elk/lib/elk-layout';
import { DiagramOptions } from 'sprotty-protocol';
import { URI } from 'vscode-uri';
import { StpaDiagramServer } from '../stpa/stpa-diagramServer';
import { CutSetGenerator } from './fta-cutSet-generator';
import { FtaDiagramGenerator } from './fta-diagram-generator';
import { FtaLayoutConfigurator } from './fta-layout-config';
import { FtaValidationRegistry, FtaValidator } from './fta-validator';


/**
 * Declaration of custom services - add your own service classes here.
 */
export type FtaAddedServices = {
    validation: {
        FtaValidator: FtaValidator;
    },
    layout: {
        ElkFactory: ElkFactory,
        ElementFilter: IElementFilter,
        LayoutConfigurator: ILayoutConfigurator;
    },
    bdd: {
        Bdd: CutSetGenerator
    }
};

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type FtaServices = LangiumSprottyServices & FtaAddedServices;

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const FtaModule: Module<FtaServices, PartialLangiumServices & SprottyDiagramServices &FtaAddedServices> = {
    diagram: {
        DiagramGenerator: services => new FtaDiagramGenerator(services), 
        ModelLayoutEngine: services => new ElkLayoutEngine(services.layout.ElkFactory, services.layout.ElementFilter, services.layout.LayoutConfigurator) as any
    },
    validation: {
        ValidationRegistry: services => new FtaValidationRegistry(services),
        FtaValidator: () => new FtaValidator()
    },
    layout: {
        ElkFactory: () => () => new ElkConstructor({ algorithms: ['layered'] }),
        ElementFilter: () => new DefaultElementFilter,
        LayoutConfigurator: () => new FtaLayoutConfigurator
    },
    bdd:{
        Bdd: () => new CutSetGenerator()
    }
};

export const ftaDiagramServerFactory =
    (services: LangiumSprottySharedServices): ((clientId: string, options?: DiagramOptions) => StpaDiagramServer) => {
        const connection = services.lsp.Connection;
        const serviceRegistry = services.ServiceRegistry;
        return (clientId, options) => {
            const sourceUri = options?.sourceUri;
            if (!sourceUri) {
                throw new Error("Missing 'sourceUri' option in request.");
            }
            const language = serviceRegistry.getServices(URI.parse(sourceUri as string)) as FtaServices;
            if (!language.diagram) {
                throw new Error(`The '${language.LanguageMetaData.languageId}' language does not support diagrams.`);
            }
            return new StpaDiagramServer(async action => {
                connection?.sendNotification(DiagramActionNotification.type, { clientId, action });
            }, language.diagram, clientId);
        };
    };
/**
 * instead of the default diagram server the fta-diagram server is used
 */
export const FtaSprottySharedModule: Module<LangiumSprottySharedServices, SprottySharedServices> = {
    diagram: {
        diagramServerFactory: ftaDiagramServerFactory,
        DiagramServerManager: services => new DefaultDiagramServerManager(services)
    }
};


