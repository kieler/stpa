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


import { LangiumDocument } from "langium";
import { TextDocumentContentChangeEvent } from "vscode";
import { RenameParams, TextEdit } from "vscode-languageserver";
import { Model } from "../generated/ast";
import { StpaServices } from "./stpa-module";
import { elementWithName } from "./stpa-validator";


export class IDEnforcer {

    protected readonly options: StpaServices;
    protected services: StpaServices;

    constructor(services: StpaServices) {
        this.services = services;
    }

    async enforceIDs(changes: TextDocumentContentChangeEvent[], uri: string) {
        // get the current model
        const textDocuments = this.services.shared.workspace.LangiumDocuments;
        const currentDoc = textDocuments.getOrCreateDocument(uri as any) as LangiumDocument<Model>;
        const model: Model = currentDoc.parseResult.value;

        if (currentDoc.parseResult.lexerErrors.length !== 0 || currentDoc.parseResult.parserErrors.length !== 0) {
            return undefined;
        }

        for (const change of changes) {
            const offset = change.rangeOffset;
            let elements: elementWithName[] = [];
            let prefix = "";


            const safetyConsOffset = model.safetyCons.length !== 0 ? model.safetyCons[0].$cstNode?.offset : Number.MAX_VALUE;
            const scenarioOffset = model.scenarios.length !== 0 ? model.scenarios[0].$cstNode?.offset : safetyConsOffset;
            const ucaConstraintOffset = model.controllerConstraints.length !== 0 ? model.controllerConstraints[0].$cstNode?.offset : scenarioOffset;
            const ucaOffset = model.rules.length !== 0 ? model.rules[0].$cstNode?.offset : (model.allUCAs.length !== 0 ? model.allUCAs[0].$cstNode?.offset : ucaConstraintOffset);
            const responsibilitiesOffset = model.responsibilities.length !== 0 ? model.responsibilities[0].$cstNode?.offset : ucaOffset;
            const constraintOffset = model.systemLevelConstraints.length !== 0 ? model.systemLevelConstraints[0].$cstNode?.offset : responsibilitiesOffset;
            const hazardOffset = model.hazards.length !== 0 ? model.hazards[0].$cstNode?.offset : constraintOffset;
            if (!hazardOffset || !constraintOffset || !responsibilitiesOffset || !ucaOffset || !ucaConstraintOffset || !scenarioOffset || !safetyConsOffset) {
                console.log("Offset could not be determined for all aspects.");
            } else if (offset < hazardOffset) {
                elements = model.losses;
                prefix = "L";
            } else if (offset < constraintOffset && offset > hazardOffset) {
                elements = model.hazards;
                //TODO: subcomponents
                prefix = "H";
            } else if (offset < responsibilitiesOffset && offset > constraintOffset) {
                elements = model.systemLevelConstraints;
                prefix = "SC";
            } else if (offset < ucaOffset && offset > responsibilitiesOffset) {
                elements = model.responsibilities.flatMap(resp => resp.responsiblitiesForOneSystem);
                prefix = "R";
            } else if (offset < ucaConstraintOffset && offset > ucaOffset) {
                elements = model.allUCAs.flatMap(uca => uca.ucas);
                elements = elements.concat(model.rules.flatMap(rule => rule.contexts));
                //TODO: RL (context table) must be unique too
                prefix = "UCA";
            } else if (offset < scenarioOffset && offset > ucaConstraintOffset) {
                elements = model.controllerConstraints;
                prefix = "C";
            } else if (offset < safetyConsOffset && offset > scenarioOffset) {
                elements = model.scenarios;
                prefix = "Scenario";
            }

            // TODO: find the element which offset is greater with the find function isntead of a loop
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element.$cstNode!.offset > offset) {
                    const edits = await this.renameIDs(elements.filter((_, index) => index >= i), prefix, elements.length, uri, currentDoc);
                    if (elements[i - 1].$cstNode !== undefined) {
                        const range = elements[i - 1].$cstNode!.range
                        range.end.character = range.start.character + elements[i-1].name.length
                        const test = TextEdit.replace(range, prefix + i);
                        edits.push(test)
                    }
                    return edits;
                }
            }
        }
    }

    protected async renameIDs(elements: elementWithName[], prefix: string, counter: number, uri: string, document: LangiumDocument) {
        let edits: TextEdit[] = [];
        for (let i = elements.length - 1; i >= 0; i--) {
            // TODO: check whether element already has the correct ID
            const element = elements[i];
            const params: RenameParams = {
                textDocument: document.textDocument,
                position: element.$cstNode!.range.start,
                newName: prefix + counter
            };
            counter--;
            const edit = await this.services.lsp.RenameProvider!.rename(document, params);
            if (edit !== undefined && edit.changes !== undefined) {
                const test = edit.changes;
                edits = edits.concat(test[uri]);
            }
        }
        return edits;
    }

}