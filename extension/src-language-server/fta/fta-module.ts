
import { createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, inject, Module, PartialLangiumServices } from 'langium';
import { DefaultDiagramServerManager, DiagramActionNotification, LangiumSprottyServices, LangiumSprottySharedServices, SprottyDiagramServices, SprottySharedServices } from 'langium-sprotty';
import { StpaDiagramServer } from '../stpa/stpa-diagramServer';
import { DiagramOptions } from 'sprotty-protocol';
import { URI } from 'vscode-uri';
import { FtaGeneratedModule, StpaGeneratedSharedModule } from '../generated/module';
import { FtaValidationRegistry, FtaValidator } from './fta-validator';
import { StpaSynthesisOptions } from '../stpa/synthesis-options';
import { FtaDiagramGenerator } from './diagram-generatorFta';








export type FtaAddedServices = {
    validation: {
        FtaValidator: FtaValidator;
    }
    options: {
        StpaSynthesisOptions: StpaSynthesisOptions
    }
}


export type FtaServices = LangiumSprottyServices & FtaAddedServices


export const FtaModule: Module<FtaServices, PartialLangiumServices & SprottyDiagramServices &FtaAddedServices> = {
    diagram: {
        DiagramGenerator: services => new FtaDiagramGenerator(services), 
    },
    validation: {
        ValidationRegistry: services => new FtaValidationRegistry(services),
        FtaValidator: () => new FtaValidator()
    },
    options: {
        StpaSynthesisOptions: () => new StpaSynthesisOptions()
    },
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
            }, language.diagram, language.options.StpaSynthesisOptions,  clientId);
        };
    };

export const FtaSprottySharedModule: Module<LangiumSprottySharedServices, SprottySharedServices> = {
    diagram: {
        diagramServerFactory: ftaDiagramServerFactory,
        DiagramServerManager: services => new DefaultDiagramServerManager(services)
    }
};

export function createFtaServices(context: DefaultSharedModuleContext): {
    shared: LangiumSprottySharedServices,
    fta: FtaServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        StpaGeneratedSharedModule,
        FtaSprottySharedModule
    );
    const fta = inject(
        createDefaultModule({ shared }),
        FtaGeneratedModule,
        FtaModule
    );
    shared.ServiceRegistry.register(fta);
   // FtaValidationRegistry;
    return { shared, fta };
}

