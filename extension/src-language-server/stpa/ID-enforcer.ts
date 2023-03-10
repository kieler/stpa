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

    protected currentUri: string;
    protected currentDocument: LangiumDocument<Model>;

    constructor(services: StpaServices) {
        this.services = services;
    }

    async enforceIDs(changes: TextDocumentContentChangeEvent[], uri: string): Promise<TextEdit[]> {
        this.currentUri = uri;
        // get the current model
        const textDocuments = this.services.shared.workspace.LangiumDocuments;
        this.currentDocument = textDocuments.getOrCreateDocument(uri as any) as LangiumDocument<Model>;
        const model: Model = this.currentDocument.parseResult.value;

        // ID enforcement can only be done if the parser has no errors. Otherwise other syntax elements than IDs are interpreted as IDs.
        if (this.currentDocument.parseResult.lexerErrors.length !== 0 || this.currentDocument.parseResult.parserErrors.length !== 0) {
            return [];
        }

        let edits: TextEdit[] = [];
        for (const change of changes) {
            const modificationOffset = change.rangeOffset;
            // calculates the elements that need to be considered for ID enforcement and the prefix that should be used for it
            const modifiedAspect = findModifiedAspect(model, modificationOffset);
            if (modifiedAspect) {
                const elements: elementWithName[] = modifiedAspect.elements;
                const prefix = modifiedAspect.prefix;

                // edits for renaming the elements below the modified element
                const index = elements.findIndex(element => element.$cstNode && element.$cstNode.offset > modificationOffset);
                if (index < 0) {
                    console.log("IDs could not be enforce. Index of modified element not found.");
                    continue;
                }
                edits = edits.concat(await this.enforceIdsBelowModifiedElement(index, elements, prefix, change.text === ''));

                // create edit to rename the modified element
                const modifiedElement = elements[index - 1];
                if (edits.length !== 0 && modifiedElement.$cstNode) {
                    const range = modifiedElement.$cstNode.range;
                    range.end.character = range.start.character + modifiedElement.name.length;
                    const modifiedElementEdit = TextEdit.replace(range, prefix + index);
                    edits.push(modifiedElementEdit);
                }
            }
        }
        return edits;
    }

    protected async enforceIdsBelowModifiedElement(index: number, elements: elementWithName[], prefix: string, decrease: boolean): Promise<TextEdit[]> {
        // guarantee that the index is not out of bounds
        if (index < 0) {
            index = 0;
        }
        // compute edits to rename all elements below the modified element
        let edits: TextEdit[] = [];
        // when elements already have the correct ID, renaming is not needed
        if (elements[elements.length - 1].name !== prefix + elements.length) {
            const modifiedElement = elements[index - 1];
            if (decrease) {
                // IDs of the elements are decreased so we must start with the lowest ID
                for (let i = index; i < elements.length; i++) {
                    const renameEdits = await this.renameID(elements[i], prefix, i);
                    edits = edits.concat(renameEdits);
                }
            } else {
                // IDs of the elements are increased so we must start with the largest ID
                for (let i = elements.length - 1; i >= index; i--) {
                    let elementToRename = elements[i];
                    if (modifiedElement && elementToRename.name === modifiedElement.name) {
                        // if the element to rename has the same name as the modified element it must be renamed manually 
                        // and the references are updated by calling the rename function with the modified element
                        if (elementToRename.$cstNode) {
                            const range = elementToRename.$cstNode.range;
                            range.end.character = range.start.character + modifiedElement.name.length;
                            const modifiedElementEdit = TextEdit.replace(range, prefix + (i + 1));
                            edits.push(modifiedElementEdit);
                        }

                        let renameEdits = await this.renameID(modifiedElement, prefix, i);
                        if (modifiedElement.$cstNode) {
                            const range = modifiedElement.$cstNode.range;
                            range.end.character = range.start.character + modifiedElement.name.length;
                            renameEdits = renameEdits.filter(edit => !(edit.range.start.line === range.start.line && edit.range.start.character === range.start.character))
                        }
                        edits = edits.concat(renameEdits);
                    } else {
                    const renameEdits = await this.renameID(elementToRename, prefix, i);
                    edits = edits.concat(renameEdits);}
                }
            }
        }
        return edits;
    }

    protected async renameID(element: elementWithName, prefix: string, counter: number): Promise<TextEdit[]> {
        let edits: TextEdit[] = [];
        if (element && element.$cstNode) {
            // parameters needed for renaming
            const params: RenameParams = {
                textDocument: this.currentDocument.textDocument,
                position: element.$cstNode.range.start,
                newName: prefix + (counter + 1)
            };
            // compute the textedits for renaming
            const edit = await this.services.lsp.RenameProvider!.rename(this.currentDocument, params);
            if (edit !== undefined && edit.changes !== undefined) {
                const changes = edit.changes;
                edits = edits.concat(changes[this.currentUri]);
            }
        }

        // return the needed textedits
        return edits;
    }

}

function findModifiedAspect(model: Model, offset: number): { elements: elementWithName[], prefix: string; } | undefined {
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
        return undefined;
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

    return { elements, prefix };
}
