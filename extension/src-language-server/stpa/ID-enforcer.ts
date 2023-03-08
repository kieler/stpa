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

            // offsets of the different aspects to calculate in which aspect the user changed something
            const safetyConsOffset = model.safetyCons.length !== 0 ? model.safetyCons[0].$cstNode?.offset : Number.MAX_VALUE;
            const scenarioOffset = model.scenarios.length !== 0 ? model.scenarios[0].$cstNode?.offset : safetyConsOffset;
            const ucaConstraintOffset = model.controllerConstraints.length !== 0 ? model.controllerConstraints[0].$cstNode?.offset : scenarioOffset;
            const ucaOffset = model.rules.length !== 0 ? model.rules[0].$cstNode?.offset : (model.allUCAs.length !== 0 ? model.allUCAs[0].$cstNode?.offset : ucaConstraintOffset);
            const responsibilitiesOffset = model.responsibilities.length !== 0 ? model.responsibilities[0].$cstNode?.offset : ucaOffset;
            const constraintOffset = model.systemLevelConstraints.length !== 0 ? model.systemLevelConstraints[0].$cstNode?.offset : responsibilitiesOffset;
            const hazardOffset = model.hazards.length !== 0 ? model.hazards[0].$cstNode?.offset : constraintOffset;
            
            // determine the aspect which element names must be updated
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

            // compute edits to rename all elements below the modified element
            // TODO: does not work if the modified element has the same name as one of the elements below it
            const index = elements.findIndex(element => element.$cstNode!.offset > offset);
            const edits = await this.renameIDs(elements.slice(index), prefix, elements.length, uri, currentDoc);

            // create edit to rename the modified element
            const modifiedElement = elements[index - 1]
            if (edits.length !== 0 && modifiedElement.$cstNode !== undefined) {
                const range = modifiedElement.$cstNode!.range;
                range.end.character = range.start.character + modifiedElement.name.length;
                const modifiedElementEdit = TextEdit.replace(range, prefix + index);
                edits.push(modifiedElementEdit);
            }

            return edits;
        }
    }

    protected async renameIDs(elements: elementWithName[], prefix: string, counter: number, uri: string, document: LangiumDocument) {
        let edits: TextEdit[] = [];
        for (let i = elements.length - 1; i >= 0; i--) {
            // when elements already have the correct ID, renaming is not needed
            const element = elements[i];
            if (element.name === prefix + counter) {
                break;
            }
            // parameters needed for renaming
            const params: RenameParams = {
                textDocument: document.textDocument,
                position: element.$cstNode!.range.start,
                newName: prefix + counter
            };
            // compute the textedits for renaming
            const edit = await this.services.lsp.RenameProvider!.rename(document, params);
            if (edit !== undefined && edit.changes !== undefined) {
                const changes = edit.changes;
                edits = edits.concat(changes[uri]);
            }
            // update number for the element name
            counter--;
        }
        // return the needed textedits
        return edits;
    }

}