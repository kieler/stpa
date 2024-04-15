/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2024 by
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

import { GeneratorContext, IdCache, IdCacheImpl, LangiumDiagramGenerator } from "langium-sprotty";
import { SModelElement, SModelRoot, SNode } from "sprotty-protocol";
import { Model } from "../../generated/ast";
import { StpaServices } from "../stpa-module";
import { createControlStructure } from "./diagram-controlStructure";
import { createRelationshipGraph } from "./diagram-relationshipGraph";
import { filterModel } from "./filtering";
import { StpaSynthesisOptions } from "./stpa-synthesis-options";
import { LangiumParser, ParseResult, AstNode, LangiumDocumentFactory } from 'langium';
import { CancellationToken } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { StpaDocumentBuilder } from '../../stpa-document-builder';
import { LanguageTemplate } from '../../templates/template-model';

export class StpaDiagramGenerator extends LangiumDiagramGenerator {
    protected readonly options: StpaSynthesisOptions;
    protected readonly parser: LangiumParser;
    protected readonly docBuilder: StpaDocumentBuilder;
    protected readonly docFactory: LangiumDocumentFactory;
    protected readonly languageId: string;

    /** Saves the Ids of the generated SNodes */
    protected idToSNode: Map<string, SNode> = new Map();

    protected idCache: IdCache<AstNode>;

    constructor(services: StpaServices) {
        super(services);
        this.options = services.options.SynthesisOptions;
        this.parser = services.parser.LangiumParser;
        this.docBuilder = services.shared.workspace.DocumentBuilder as StpaDocumentBuilder;
        this.docFactory = services.shared.workspace.LangiumDocumentFactory as LangiumDocumentFactory;
        this.languageId = services.LanguageMetaData.languageId;
    }
    /**
     * Generates an SGraph for the given {@code template}.
     * @param template The template for which a graph should be generated.
     * @returns the SGraph.
     */
    async generateTemplateRoot(template: LanguageTemplate): Promise<SModelRoot | undefined> {
        if (!this.idCache) {
            this.idCache = new IdCacheImpl();
        }
        const parseRes = await this.getTempalteAST(template);
        if (!parseRes) {
            return undefined;
        } else {
            const graph = this.generateGraph(parseRes);
            graph.id = template.id;
            return graph;
        }
    }

     /**
     * Calculates the parse result for {@code template}.
     * @param template The template that should be parsed.
     * @returns The AST for {@code template}.
     */
     protected async getTempalteAST(template: LanguageTemplate): Promise<Model | undefined> {
        // in order for the cross-references to be correctly evaluated, a document must be build
        const uri = 'file:///template.stpa';
        const textDocument = TextDocument.create(uri, this.languageId, 0, template.baseCode ?? '');
        const parseResult: ParseResult<Model> = this.parser.parse<Model>(template.baseCode);
        if (parseResult.parserErrors.length > 0) {
            return undefined;
        }
        // const doc = documentFromText<Model>(textDocument, parseResult);
        const doc = this.docFactory.fromTextDocument<Model>(textDocument);
        await this.docBuilder.buildDocuments([doc], {validationChecks: 'none'}, CancellationToken.None);

        return doc.parseResult.value;
    }

    /**
     * Deletes the dangling edges in {@code template}.
     * @param template The template which edges should be inspected.
     */
    async deleteDanglingEdges(template: LanguageTemplate): Promise<void> {
        const model = await this.getTempalteAST(template);
        if (model) {
            const nodes = model.controlStructure?.nodes;
            const nodeIDs = new Set<string>();
            nodes?.forEach(node => nodeIDs.add(node.name));
            const danglingNodes = new Set<string>();
            for (const node of nodes ?? []) {
                node.actions.filter(action => {
                    if (!nodeIDs.has(action.target.$refText)) {
                        danglingNodes.add(action.target.$refText);
                        return false;
                    }
                    return true;
                });
                node.feedbacks.filter(feedback => {
                    if (!nodeIDs.has(feedback.target.$refText)) {
                        danglingNodes.add(feedback.target.$refText);
                        return false;
                    }
                    return true;
                });
            }
            danglingNodes.forEach((node) => {
                const newString = template.baseCode.replace(/->( )*/, "-> ");
                const endIndex = newString.indexOf("-> " + node) + 3 + node.length;
                const startIndex = newString.substring(0, endIndex).lastIndexOf('[');
                template.baseCode = newString.substring(0, startIndex).trimEnd() + newString.substring(endIndex + 1, newString.length);
            });
        }
    }

    /**
     * Generates a SGraph for the STPA model contained in {@code args}.
     * @param args GeneratorContext for the STPA model.
     * @returns the root of the generated SGraph.
     */
    protected generateRoot(args: GeneratorContext<Model>): SModelRoot {
        const { document } = args;
        const model: Model = document.parseResult.value;
        if (!this.idCache) {
            this.idCache = args.idCache;
        }
        return this.generateGraph(model);
    }


    /**
     * Generates an SGraph for the given {@code model}.
     * @param model The Model for whcih a graph should be generated.
     * @returns an SGraph.
     */
    private generateGraph(model: Model): SModelRoot {

        // filter model based on the options set by the user
        const filteredModel = filterModel(model, this.options);

        const rootChildren: SModelElement[] = [];
        if (filteredModel.controlStructure) {
            // add control structure to roots children
            rootChildren.push(
                createControlStructure(filteredModel.controlStructure, this.idToSNode, this.options, this.idCache)
            );
        }
        // add relationship graph to roots children
        rootChildren.push(createRelationshipGraph(filteredModel, model, this.idToSNode, this.options, this.idCache));
        // return root
        return {
            type: "graph",
            id: "root",
            children: rootChildren,
        };
    }
}
