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

import { AstNode, LangiumDocumentFactory } from "langium";
import { GeneratorContext, IdCache, IdCacheImpl } from "langium-sprotty";
import { SModelElement, SModelRoot, SNode } from "sprotty-protocol";
import { CancellationToken } from "vscode-languageserver";
import { URI } from "vscode-uri";
import { Model } from "../../generated/ast";
import { LanguageSnippet, SnippetGraphGenerator } from "../../snippets/snippet-model";
import { StpaDocumentBuilder } from "../../stpa-document-builder";
import { StpaServices } from "../stpa-module";
import { createControlStructure } from "./diagram-controlStructure";
import { createRelationshipGraph } from "./diagram-relationshipGraph";
import { filterModel } from "./filtering";
import { StpaSynthesisOptions } from "./stpa-synthesis-options";

export class StpaDiagramGenerator extends SnippetGraphGenerator {
    protected readonly options: StpaSynthesisOptions;
    protected readonly services: StpaServices;

    /** Saves the Ids of the generated SNodes */
    protected idToSNode: Map<string, SNode> = new Map();

    protected idCache: IdCache<AstNode>;

    constructor(services: StpaServices) {
        super(services);
        this.options = services.options.SynthesisOptions;
        this.services = services;
    }
    /**
     * Generates an SGraph for the given {@code snippet}.
     * @param snippet The snippet for which a graph should be generated.
     * @returns the SGraph for {@code snippet}.
     */
    async generateSnippetRoot(snippet: LanguageSnippet): Promise<SModelRoot | undefined> {
        // id cache is needed
        if (!this.idCache) {
            this.idCache = new IdCacheImpl();
        }
        // parse the snippet to an AST
        const parseRes = await this.getSnippetAST(snippet);
        if (!parseRes) {
            return undefined;
        } else {
            // create the SGraph
            const graph = this.generateGraph(parseRes);
            graph.id = snippet.id;
            return graph;
        }
    }

    /**
     * Calculates the parse result for {@code snippet}.
     * @param snippet The snippet that should be parsed.
     * @returns the AST for {@code snippet}.
     */
    protected async getSnippetAST(snippet: LanguageSnippet): Promise<Model | undefined> {
        // in order for the cross-references to be correctly evaluated, a document must be build
        const uri = "file:///snippet.stpa";
        const doc = (this.services.shared.workspace.LangiumDocumentFactory as LangiumDocumentFactory).fromString<Model>(
            snippet.baseCode,
            URI.parse(uri)
        );
        await (this.services.shared.workspace.DocumentBuilder as StpaDocumentBuilder).buildDocuments(
            [doc],
            { validationChecks: "none" },
            CancellationToken.None
        );

        return doc.parseResult.value;
    }

    /**
     * Deletes the dangling edges in {@code snippet}.
     * @param snippet The snippet, which edges should be inspected.
     */
    async deleteDanglingEdges(snippet: LanguageSnippet): Promise<void> {
        const model = await this.getSnippetAST(snippet);
        if (model) {
            // collect nodes and their ids
            const nodes = model.controlStructure?.nodes;
            const nodeIDs = new Set<string>();
            nodes?.forEach(node => nodeIDs.add(node.name));
            // collect dangling node ids from control actions and feedbacks
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
            // remove dangling edges
            danglingNodes.forEach(node => {
                // regex matches the edges that have the dangling node as target
                const regex = new RegExp(`\\[.*\\]\\s*->\\s*${node}`, "g");
                // remove the edges from the base code
                snippet.baseCode = snippet.baseCode.replace(regex, "");
            });
        }
    }

    /**
     * Generates an SGraph for the STPA model contained in {@code args}.
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
     * @param model The Model for which a graph should be generated.
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
