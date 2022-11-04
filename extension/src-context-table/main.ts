/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import './css/table.css';
import { Table } from '@kieler/table-webview/lib/table';
import { SendContextTableDataAction } from './actions';
import { createHeaderElement, createHeaders, createRow, createTable, patch } from './html';
import { addSelector, addText, BigCell, ControlAction, convertControlActionsToStrings, replaceSelector, Rule, SystemVariables, Type, Variable, VariableValues } from './utils';
import { VNode } from "snabbdom";
import { createResults, getResult } from './context-table-logic';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class ContextTable extends Table {

    /** Ids for the html elements */
    protected actionSelectorId = "select_action";
    protected typeSelectorId = "select_type";
    protected tableId = "context_table";

    // data of the table
    protected rules: Rule[] = [];
    protected controlActions: ControlAction[] = [];
    protected systemVariables: SystemVariables[] = [];

    // variables to store the currently selected options of the select elements in
    protected selectedControlAction: ControlAction;
    protected selectedType: Type = Type.PROVIDED;
    protected currentVariables: VariableValues[] = [];

    protected handleMessages(message: any): void {
        const action = message.data.action;
        if (action) {
            if (SendContextTableDataAction.isThisAction(action)) {
                this.handleData(action as SendContextTableDataAction);
            } else {
                super.handleMessages(message);
            }
        } else {
            super.handleMessages(message);
        }
    }

    /**
     * Updates the data of the context table.
     * @param action SendContextTableDataAction that contains the data needed to create the table contents.
     */
    protected handleData(action: SendContextTableDataAction): void {
        this.rules = action.data.rules;
        this.controlActions = action.data.actions;
        this.systemVariables = action.data.systemVariables;
        this.updateActionSelector();
        this.updateTable();
    }

    protected handleResetTable(): void {
        const table = document.getElementById(this.tableId);
        if (table) {
            const newTable = createTable(this.tableId, "80px");
            patch(table, newTable);
        }
    }

    protected initHtml(identifier: string, headers: string[]): void {
        this.identifier = identifier;
        this.tableId = this.identifier + "_table";
        const mainDiv = document.getElementById(identifier + '_container');
        if (mainDiv) {
            // Create text and selector element for selecting a control action
            addText(mainDiv, "Choose a Control Action:", "0px");
            addSelector(mainDiv, this.actionSelectorId, 0, [], "11px", "210px");

            // Create text and selector element for selecting the action type
            addText(mainDiv, "Choose a Type:", "40px");
            addSelector(mainDiv, this.typeSelectorId, this.selectedType, ["provided", "not provided", "both"], "51px", "130px");

            // add listener
            const htmlTypeSelector = document.getElementById(this.typeSelectorId) as HTMLSelectElement;
            htmlTypeSelector.addEventListener('change', () => {
                switch (htmlTypeSelector.selectedIndex) {
                    case 0:
                        this.selectedType = Type.PROVIDED;
                        break;
                    case 1:
                        this.selectedType = Type.NOT_PROVIDED;
                        break;
                    case 2:
                        this.selectedType = Type.BOTH;
                        break;
                }
                this.updateTable();
            });

            // Create text element for table
            addText(mainDiv, "Hover over the hazards to see their associated rules!", "90px");
            // create a table
            const placeholderTable = document.createElement("table");
            mainDiv.append(placeholderTable);
            const table = createTable(this.tableId, "80px");
            patch(placeholderTable, table);
        }
    }

    /**
     * Initializes the action selector with the available actions.
     */
    protected updateActionSelector(): void {
        const selector = document.getElementById(this.actionSelectorId) as HTMLSelectElement;
        if (selector) {
            // translate control actions to strings and add them to the selector
            const actions = convertControlActionsToStrings(this.controlActions);
            replaceSelector(selector, actions, 0);

            // update currently selected control action
            this.updateControlActionSelection(0);

            // add listener
            const htmlActionSelector = document.getElementById(this.actionSelectorId) as HTMLSelectElement;
            htmlActionSelector.addEventListener('change', () => {
                this.updateControlActionSelection(htmlActionSelector.selectedIndex);
                this.updateTable();
            });
        }
    }

    /**
     * Sets the current variables based on the current controller.
     */
    protected setCurrentVariables(): void {
        const variables = this.systemVariables.find(systemVariable => systemVariable.system === this.selectedControlAction.controller)?.variables;
        if (variables) {
            this.currentVariables = variables;
        } else {
            console.log("No system component selected");
        }
    }

    /**
     * Creates the header (first table row) of the context table.
     * @param table The HTML table element to complete.
     */
    protected createHeader(table: HTMLTableElement): void {
        // create and add a header placeholder
        const placeholderHeader = document.createElement("tr");
        table.appendChild(placeholderHeader);

        const headers: VNode[] = [];
        // the first column is for the control action and has no subheader
        const controlActionHeader = createHeaderElement("Control Action", 2);
        headers.push(controlActionHeader);

        // the second header column is for the context and needs to span as many columns as there are context variables
        if (this.currentVariables.length > 0) {
            const contextVariablesHeader = createHeaderElement("Context Variables", undefined, this.currentVariables.length);
            headers.push(contextVariablesHeader);
        }

        // The third header column is the hazardous column
        // The column-/row-span depends on what action type has been selected
        let colSpan: number | undefined = undefined;
        let rowSpan: number | undefined = undefined;
        switch (this.selectedType) {
            case Type.PROVIDED:
                colSpan = 3;
                break;
            case Type.NOT_PROVIDED:
                rowSpan = 2;
                break;
            case Type.BOTH:
                colSpan = 4;
                break;
        }
        const hazardousHeader = createHeaderElement("Hazardous?", rowSpan, colSpan);
        headers.push(hazardousHeader);

        // create correct header
        const headersElement = createHeaders(headers);
        patch(placeholderHeader, headersElement);
    }

    /**
     * Creates the sub-header (second table row) of the context table.
     * @param table The HTML table element to complete.
     */
    protected createSubHeader(table: HTMLTableElement): void {
        // create and add placeholder for subheaders
        const placeholdersubHeaders = document.createElement("tr");
        table.appendChild(placeholdersubHeaders);

        const headers: VNode[] = [];
        // sub-headers for the context variables
        this.currentVariables.forEach(variable => {
            const header = createHeaderElement(variable.name);
            headers.push(header);
        });
        // hazardous sub-options, which depend on the selected action type
        let times: string[] = [];
        switch (this.selectedType) {
            case Type.PROVIDED:
                times = ["Anytime", "Too Early / Too Late", "Stopped Too Soon / Applied Too Long"];
                break;
            case Type.BOTH:
                times = ["Anytime", "Too Early / Too Late", "Stopped Too Soon / Applied Too Long", "Never"];
                break;
        }
        times.forEach(time => {
            const header = createHeaderElement(time);
            headers.push(header);
        });
        // create correct header
        const headersElement = createHeaders(headers);
        patch(placeholdersubHeaders, headersElement);
    }

    /**
     * Updates the currently selected control action.
     * @param index Index determining which control action is selected.
     */
    protected updateControlActionSelection(index: number): void {
        this.selectedControlAction = this.controlActions[index];
        this.setCurrentVariables();
    }

    /**
     * Creates the content of the table.
     */
    protected updateTable(): void {
        // reset old table
        this.handleResetTable();
        const table = document.getElementById(this.tableId) as HTMLTableElement;
        if (table) {
            // create the headers
            this.createHeader(table);
            this.createSubHeader(table);
            if (this.currentVariables.length > 0) {
                // generate all possible contexts
                const contexts = this.createContexts(0, this.currentVariables, []);
                contexts.forEach(context => this.addRow(table, context, "context"))
            } else {
                // table is empty
                this.addRow(table, [], "empty-row");
            }
        }
    }


    /**
     * Creates and appends one non-header row to the table. 
     * @param table The HTMLTableElement to apply the row to.
     * @param variables The context variable values that should be written into the current row.
     * @param id The id of the row.
     */
    protected addRow(table: HTMLTableElement, variables: Variable[], id: string): void {
        // create row placeholder
        const placeholderRow = document.createElement("tr");
        table.appendChild(placeholderRow);

        let cells: BigCell[] = [];
        // the control action text based on the currently selected options
        let controlAction = "";
        const type = document.getElementById("select_type") as HTMLSelectElement;
        if (type.options[type.selectedIndex].text == "both") {
            controlAction = this.selectedControlAction.action + " provided";
        } else {
            controlAction = this.selectedControlAction.action + " " + type.options[type.selectedIndex].text;
        }
        cells.push({ cssClass: "control-action", value: controlAction, colSpan: 1 });

        if (variables.length > 0) {
            // values of the context variables
            const valueCells = variables.map(variable => { return { cssClass: "context-variable", value: variable.value, colSpan: 1 }; });
            cells = cells.concat(valueCells);

            // calculate whether the control action is hazardous
            const result = getResult(variables, this.rules, this.selectedControlAction.controller, this.selectedControlAction.action, this.selectedType, this.currentVariables);
            // write the result into the column(s)
            switch (this.selectedType) {
                //TODO: evaluate
                case Type.PROVIDED:
                    cells = cells.concat(createResults(result, 3));
                    break;
                case Type.NOT_PROVIDED:
                    const firstRes = result[0];
                    let text = "";
                    if (firstRes[0] == "No") {
                        text = firstRes[0];
                    } else {
                        // entry.title = firstRes[0];
                        text = firstRes[2].toString();
                    }
                    cells.push({ cssClass: "result", value: text, colSpan: 1 });
                    break;
                case Type.BOTH:
                    cells = cells.concat(createResults(result, 4));
                    break;
            }
        } else {
            let span: number = 0;
            switch (this.selectedType) {
                case Type.PROVIDED:
                    span = 3;
                    break;
                case Type.NOT_PROVIDED:
                    span = 1;
                    break;
                case Type.BOTH:
                    span = 4;
                    break;
            }
            cells.push({ cssClass: "result", value: "No", colSpan: span });
        }

        const row = createRow(id, cells);
        patch(placeholderRow, row);
    }


    /**
     * Generates all possible value combinations of the given variables.
     * @param variableIndex Index to determine from which variable to apply a value next.
     * @param variableValues All variables with their possible values for which the combinations should be generated.
     * @param determinedValues The already determined variable values.
     * @returns All possible value combinations of the given variables.
     */
    protected createContexts(variableIndex: number, variableValues: VariableValues[], determinedValues: Variable[]): (Variable[])[] {
        let result: (Variable[])[] = []
        // load the values of the current recursion's variable
        const currentValues = variableValues[variableIndex].values;
        const lastVariable = variableIndex == variableValues.length - 1;
        // go through all the values of the current variable
        for (let valueIndex = 0; valueIndex < currentValues.length; valueIndex++) {
            // push the currently indexed value
            determinedValues.push({name: variableValues[variableIndex].name, value: currentValues[valueIndex]});
            // if this was the last value to be added, a complete collection of values has been assembles to create a row
            if (lastVariable) {
                const context: Variable[] = []
                determinedValues.forEach(variable => context.push(variable))
                result.push(context)
            } else {
                // else, go to the next variable and call the method on it
                result = result.concat(this.createContexts(variableIndex + 1, variableValues, determinedValues));
            }
            // remove the currently indexed value afterward, when all possible contexts with it have been collected
            determinedValues.pop();
        }
        return result
    }


}

new ContextTable();