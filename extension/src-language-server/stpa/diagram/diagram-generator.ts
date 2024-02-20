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

import { GeneratorContext, LangiumDiagramGenerator } from "langium-sprotty";
import { SModelElement, SModelRoot, SNode } from "sprotty-protocol";
import { Model } from "../../generated/ast";
import { StpaServices } from "../stpa-module";
import { createControlStructure } from "./diagram-controlStructure";
import { createRelationshipGraph } from "./diagram-relationshipGraph";
import { filterModel } from "./filtering";
import { StpaSynthesisOptions } from "./stpa-synthesis-options";

export class StpaDiagramGenerator extends LangiumDiagramGenerator {
    protected readonly options: StpaSynthesisOptions;

    /** Saves the Ids of the generated SNodes */
    protected idToSNode: Map<string, SNode> = new Map();

    constructor(services: StpaServices) {
        super(services);
        this.options = services.options.SynthesisOptions;
    }

    /**
     * Generates a SGraph for the STPA model contained in {@code args}.
     * @param args GeneratorContext for the STPA model.
     * @returns the root of the generated SGraph.
     */
    protected generateRoot(args: GeneratorContext<Model>): SModelRoot {
        const { document } = args;
        const model: Model = document.parseResult.value;
        // filter model based on the options set by the user
        const filteredModel = filterModel(model, this.options);

        const rootChildren: SModelElement[] = [];
        if (filteredModel.controlStructure) {
            // add control structure to roots children
            rootChildren.push(
                createControlStructure(filteredModel.controlStructure, this.idToSNode, this.options, args)
            );
        }
        // add relationship graph to roots children
        rootChildren.push(createRelationshipGraph(filteredModel, model, this.idToSNode, this.options, args));
        // return root
        return {
            type: "graph",
            id: "root",
            children: rootChildren,
        };
    }
}
