/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2022 by
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

import ElkConstructor from "elkjs/lib/elk.bundled";
import {
    Module,
    PartialLangiumServices
} from "langium";
import {
    LangiumSprottyServices,
    SprottyDiagramServices
} from "langium-sprotty";
import {
    DefaultElementFilter,
    ElkFactory,
    IElementFilter,
    ILayoutConfigurator
} from "sprotty-elk/lib/elk-layout";
import { LayoutEngine } from "../layout-engine";
import { IDEnforcer } from "./ID-enforcer";
import { ContextTableProvider } from "./contextTable/context-dataProvider";
import { StpaDiagramGenerator } from "./diagram/diagram-generator";
import { StpaLayoutConfigurator } from "./diagram/layout-config";
import { StpaSynthesisOptions } from "./diagram/stpa-synthesis-options";
import { StpaScopeProvider } from "./stpa-scopeProvider";
import { StpaValidationRegistry, StpaValidator } from "./stpa-validator";

/**
 * Declaration of custom services - add your own service classes here.
 */
export type StpaAddedServices = {
    references: {
        StpaScopeProvider: StpaScopeProvider;
    };
    validation: {
        StpaValidator: StpaValidator;
    };
    layout: {
        ElkFactory: ElkFactory;
        ElementFilter: IElementFilter;
        LayoutConfigurator: ILayoutConfigurator;
    };
    options: {
        SynthesisOptions: StpaSynthesisOptions;
    };
    contextTable: {
        ContextTableProvider: ContextTableProvider;
    };
    utility: {
        IDEnforcer: IDEnforcer;
    };
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
        DiagramGenerator: (services) => new StpaDiagramGenerator(services),
        ModelLayoutEngine: (services) =>
            new LayoutEngine(
                services.layout.ElkFactory,
                services.layout.ElementFilter,
                services.layout.LayoutConfigurator
            ) as any,
    },
    references: {
        ScopeProvider: (services) => new StpaScopeProvider(services),
        StpaScopeProvider: (services) => new StpaScopeProvider(services),
    },
    validation: {
        ValidationRegistry: (services) => new StpaValidationRegistry(services),
        StpaValidator: () => new StpaValidator(),
    },
    layout: {
        ElkFactory: () => () => new ElkConstructor({ algorithms: ["layered", "rectpacking"] }),
        ElementFilter: () => new DefaultElementFilter(),
        LayoutConfigurator: () => new StpaLayoutConfigurator(),
    },
    options: {
        SynthesisOptions: () => new StpaSynthesisOptions(),
    },
    contextTable: {
        ContextTableProvider: (services) => new ContextTableProvider(services),
    },
    utility: {
        IDEnforcer: (services) => new IDEnforcer(services),
    },
};
