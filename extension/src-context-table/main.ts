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
import { Table } from '@kieler/table-webview/lib/table'
import { SendContextTableDataAction } from './actions';
import { createTable, patch } from './html';
import { addSelector, addText, createStrings, replaceSelector } from './utils';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Main extends Table {

    /** Ids for the html elements */
    protected actionSelectorId = "select_action"
    protected typeSelectorId = "select_type"
    protected tableId = "context_table"


    // data of the table
    // TODO: determine type
    protected rules: any[];
    protected controlActions: any[];
    protected systemVariables: any[];

    /* protected rules: any[];
    protected actions: ControlAction[];
    protected variables: SystemVariables[]; */

    //????????????
    // array used for a recursive method;
    // is probably redundant and could be integrated into said method as a local variable,
    // but I'll leave it for now
    protected callBack: any[] = [];

    // variables to store the currently selected options of the select elements in
    protected selectedAction: any;
    protected currentController: any;
    protected selectedType: number = 0;
    protected currentVariables : any[];

    protected handleMessages(message: any): void {
        const action = message.data.action
        if (action) {
            if (SendContextTableDataAction.isThisAction(action)) {
                this.handleData(action as SendContextTableDataAction)
            } else {
                super.handleMessages(message);
            }
        } else {
            super.handleMessages(message);
        }
    }

    /**
     * Saves the data for the context table and updates the table.
     * @param action SendContextTableDataAction that contains the data needed to create the table contents.
     */
    protected handleData(action: SendContextTableDataAction) {
        this.rules = action.rules;
        this.controlActions = action.actions;
        this.systemVariables = action.variables;
        this.initActionSelector();
        this.initTableData();
    }

    protected initHtml(identifier: string, headers: string[]): void {
        this.identifier = identifier
        const mainDiv = document.getElementById(identifier + '_container');
        if (mainDiv) {
            // Create text and selector element for selecting a control action
            addText(mainDiv, "Choose a Control Action:", "0px");
            addSelector(mainDiv, this.actionSelectorId, 0, [], "11px", "210px");

            // Create text and selector element for selecting the action type
            addText(mainDiv, "Choose a Type:", "40px")
            addSelector(mainDiv, this.typeSelectorId, this.selectedType, ["provided", "not provided", "both"], "51px", "130px")

            // add listener
            const htmlTypeSelector = document.getElementById(this.typeSelectorId) as HTMLSelectElement;
            this.createSelectorListener(htmlTypeSelector!, false);

            // Create text element for table
            addText(mainDiv, "Hover over the hazards to see their associated rules!", "90px");
            // create a table
            const placeholderTable = document.createElement("table");
            mainDiv.append(placeholderTable)
            const table = createTable(this.tableId, "80px");
            patch(placeholderTable, table);
        }
    }


    /**
     * Initializes the action selector with the available actions.
     */
    protected initActionSelector() {
        const selector = document.getElementById(this.actionSelectorId) as HTMLSelectElement;
        if (selector) {
            // translate control actions to strings and add them to the selector
            const actions = createStrings(this.controlActions);
            replaceSelector(selector, actions, 0);

            // TODO: is this necessary?
            const selected = this.controlActions[0];
            this.currentController = selected[0];
            this.selectedAction = selected[1];

            // add listener
            const htmlTypeSelector = document.getElementById(this.actionSelectorId) as HTMLSelectElement;
            this.createSelectorListener(htmlTypeSelector, true);
        }
    }

    /**
     * Initializes the context table.
     */
    protected initTableData() {
        this.setCurrentVariables();

        const oldTable = document.getElementById("table");
        oldTable?.parentNode?.removeChild(oldTable);
        // Call method to create the table.
        this.updateTable();
    }

    /**
     * Sets the current variables based on the current controller.
     */
    protected setCurrentVariables() {
        this.currentVariables = this.systemVariables.find(systemVariable => systemVariable[0] === this.currentController)[1]
    }




    /**
     * Creates and assembles the table element.
     */
    protected updateTable() {
        const mainDiv = document.getElementById(this.identifier + '_container');
        if (mainDiv) {
            // TODO: jsx and teble webview
            // call method to create the header row
           /*  this.createHeader(tableDiv);
            // call method to create the subheader row
            this.createSubHeader(tableDiv);
            // filter only the value arrays for each variable out of currentContext and append them all to an array.
            if(this.currentVariables.length > 0) {
                let varVals : any[] = [];
                this.currentVariables.forEach(variable => {
                    varVals.push(variable[1]);
                })
                // Call method to recursively create a row for each possible context
                this.getCurrentValList(tableDiv, 0, varVals);
            } else {
                this.createRow(tableDiv, []);
            } */
        }
    }

    /**
     * Creates the header (first table row) of the context table.
     * @param table The HTML table element to complete.
     */
    protected createHeader(table: HTMLTableElement) {
        // create the header row element
        const header = document.createElement("tr");
        table.appendChild(header);
        // the first column is for the control action and has no subheader
        const controlAction = document.createElement("th");
        controlAction.innerHTML = "Control Action";
        controlAction.rowSpan = 2;
        header.appendChild(controlAction);
        // the second header column is for the context and needs to span as many columns as there are context variables
        if (this.currentVariables.length > 0) {
            const vars = document.createElement("th");
            vars.innerHTML = "Context Variables";
            vars.colSpan = this.currentVariables.length;
            header.appendChild(vars);
        }
        // The third header column is the hazardous column
        const hazardous = document.createElement("th");
        hazardous.innerHTML = "Hazardous?";
        // The column-/row-span depends on what action type has been selected
        switch(this.selectedType) {
            case 0:
                hazardous.colSpan = 3;
                break;
            case 1:
                hazardous.rowSpan = 2;
                break;
            case 2:
                hazardous.colSpan = 4;
                break;
        }
        header.appendChild(hazardous);
    }

    /**
     * Creates the sub-header (second table row) of the context table.
     * @param table The HTML table element to complete.
     */
    protected createSubHeader(table: HTMLTableElement) {
        // create sub-header row element
        const subHeader = document.createElement("tr");
        table.appendChild(subHeader);
        // the control action header spans both rows, so the next thing to be appended to the sub-header are the context variables
        if (this.currentVariables.length > 0) {
            this.currentVariables.forEach(variable => {
                let col = document.createElement('th');
                col.innerHTML = variable[0];
                subHeader.appendChild(col);
            })
        }
        // append the hazardous sub-options, which depend on the selected action type
        switch(this.selectedType) {
            case 0:
                const times = ["Anytime", "Too Early / Too Late", "Stopped Too Soon / Applied Too Long"];
                this.createSubElements(subHeader, times, "th");
                break;
            case 2:
                const nTimes = ["Anytime", "Too Early / Too Late", "Stopped Too Soon / Applied Too Long", "Never"];
                this.createSubElements(subHeader, nTimes, "th");
                break;
        }
    }

    /**
     * Creates multiple children elements with a given type for a given parent element.
     * @param parent The element to which to apply the children elements to.
     * @param children Preferrably a string array, the elements of which to apply to the parent element.
     * @param elementType The type of Div element the children elements should be created with.
     */
         protected createSubElements(parent: HTMLElement, children: any[], elementType: string) {
            // similar to the createSelector method, but generalized for multiple types
            children.forEach(child => {
                let newElement = document.createElement(elementType);
                newElement.innerHTML = child;
                parent.appendChild(newElement);
            })
        }

    /**
     * Creates and appends one non-header row to the table. 
     * @param table The HTMLTableElement to apply the row to.
     * @param values The context variable values that should be written into the current row.
     */
    protected createRow(table: HTMLTableElement, values: any[]) {
        // create the new row element
        const row = document.createElement("tr");
        table.appendChild(row);
        // write the control action into the the first column
        const controlAction = document.createElement("td");
        // the get the control action text out of the currently selected options in the selection elements
        const type = <HTMLSelectElement> document.getElementById("select_type");
        if(type.options[type.selectedIndex].text == "both") {
            controlAction.innerHTML = this.selectedAction + " provided";
        } else {
            controlAction.innerHTML = this.selectedAction + " " + type.options[type.selectedIndex].text;
        }
        row.appendChild(controlAction);
        if (values.length > 0) {
            // write the given values into the context variable columns
            this.createSubElements(row, values, "td");
            const varVals = this.reappendValNames(values);
            // call method to calculate if the control action is hazardous
            const result = this.getResult(varVals);
            // write the result into the column(s)
            switch(this.selectedType) {
                case 0:
                    this.createResults(row, result, 3);
                    break;
                case 1:
                    const firstRes = result[0];
                    const entry = document.createElement("td");
                    if (firstRes[0] == "No") {
                        entry.innerHTML = firstRes[0];
                    } else {
                        entry.title = firstRes[0];
                        entry.innerHTML = firstRes[2].toString();
                    }
                    row.appendChild(entry);
                    break;
                case 2:
                    this.createResults(row, result, 4);
                    break;
            }
        } else {
            let span : number = 0;
            switch(this.selectedType) {
                case 0:
                    span = 3;
                    break;
                case 1:
                    span = 1;
                    break;
                case 2:
                    span = 4;
                    break;
            }
            const no = document.createElement("td");
            no.innerHTML = "No";
            no.colSpan = span;
            row.appendChild(no);
        }
    }

    /**
     * Completes a non-header row with the calculated values for the "Hazardous?"-column.
     * @param parent The row to apply the values to.
     * @param result The results calculated with the getResult method.
     * @param index The number of columns the "Hazardous?"-column currently has.
     */
    protected createResults(parent: HTMLTableRowElement, result: [string, number, string[]][], index: number) {
        // check if the first result comes with a 0, which is the indicator that all columns should
        // simply be filled with a single "No" 
        const firstRes = result[0];
        // if there is no 0, then there is at least one rule to be applied
        if (firstRes[1] != 0) {
            // push all the numbers from result into a separate array
            let numbers: number[] = [];
            let counter : number = 0;
            result.forEach(res => {
                numbers.push(res[1]);
            })
            // go through all of the hazardous columns
            for(let i = 1; i <= index; i++) {
                // if there is an entry in the numbers that equals the current, a rule from result should be applied now
                if (numbers.includes(i)) {
                    if (counter != 0) {
                        const no = document.createElement("td");
                        no.innerHTML = "No";
                        no.colSpan = counter;
                        parent.appendChild(no);
                        counter = 0;
                    }
                    const entry = document.createElement("td");
                    let numberIndex = numbers.indexOf(i);
                    let iRes = result[numberIndex];
                    entry.title = iRes[0];
                    entry.innerHTML = iRes[2].toString();
                    parent.appendChild(entry);
                } else {
                    // else, there is no rule for this cell
                    counter = counter + 1;
                    if (i == index && counter != 0) {
                        const no = document.createElement("td");
                        no.innerHTML = "No";
                        no.colSpan = counter;
                        parent.appendChild(no);
                    }
                }
            }
        } else {
            // else, there is no rule for the entire row, so it's filled in with a single "No"
            const no = document.createElement("td");
            no.innerHTML = firstRes[0];
            no.colSpan = index;
            parent.appendChild(no);
        }
    }

    /**
     * Recursive method that iterates through all possible value combinations of the context variables.
     * Assembles an array with a combination of values, then sends it to the createRow method, until all possible combinations have been cycled through,
     * and subsequently, all necessary rows have been assembled.
     * @param table The HTMLTableElement to apply the rows to. Needed for the createRow method call.
     * @param index A helper index to determine from which context variable to apply a value next.
     * @param values Array that holds one array entry for each context variable, containing all its possible values.
     */
    protected getCurrentValList(table: HTMLTableElement, index: number, values: any[]) {
        // boolean to help recognize when the last variable is reached 
        let last = false;
        // load the values of the current recursion's variable
        const currentValues = values[index];
        // check if variable is the last variable of the array
        if(index == values.length - 1) {last = true;}
        // go through all the values of the current variable
        for(let privateIndex = 0; privateIndex < currentValues.length; privateIndex++) {
            // push the currently indexed value
            this.callBack.push(currentValues[privateIndex]);
            // if this was the last value to be added, a complete collection of values has been assembles to create a row
            if(last) {
                this.createRow(table, this.callBack);
            } else {
                // else, go to the next variable and call the method on it
                index++;
                this.getCurrentValList(table, index, values);
                index--;
            }
            // remove the currently indexed value afterward, when all possible contexts with it in it have been applied to the table
            this.callBack.pop();
        }
    }

    /**
     * Gets the variable names from the currentContext Array
     * and returns it together with the array of the current row's values.
     * @param values The array containing the values that have been assigned to the context variables in the current row.
     * @returns An array containing both the variable-names array and the assigned-values array.
     * The indices for each variable and its assigned value sync up.
     */
    protected reappendValNames(values: any[]) {
        // create empty array for end result
        let varVals: any[] = [];
        // create an empty array for the variable names
        let currentVars: any[] = [];
        // filter all the variable names out of the variable data and append them to the array
        for (let i = 0; i < values.length; i++) {
            const currentVar = this.currentVariables[i];
            currentVars.push(currentVar[0]);
        }
        // push both the variable name array and the value array into the end result array 
        varVals.push(currentVars);
        varVals.push(values);
        return varVals;
    }

    /**
     * Calculates if a control action is hazardous or not
     * given a specified context using the rules defined in the .stpa file.
     * @param varVals The context consisting of the context variables and their currently assigned values.
     * @returns If the action is hazardous, returns an array with all the rules (ID as string) that apply as well as their types (as number).
     * Else, returns string "No" to be applied to all of the "Hazardous"-column's columns.
     * 
     */
    protected getResult(varVals: any[]): [string, number, string[]][] {
        // create an empty array for the end result
        let resultList: [string, number, string[]][] = [];
        // check all the rules
        this.rules.forEach(rule => {
            // check if the control action applies first
            const ruleAction = rule[1];
            if (ruleAction[0] == this.currentController && ruleAction[1] == this.selectedAction) {
                // check if the context applies next
                if (this.checkValues(rule[3], varVals)) {
                    // convert the given type string to lowercase
                    const typeString = rule[2] as string;
                    const checkString = typeString.toLowerCase();
                    // check if it is one of the accepted types that can be worked with,
                    // if so, push rule onto the end result array with a fitting indicator as to what cell to write the rule in
                    // this depends on the selected action type in the selector element
                    switch(this.selectedType) {
                        case 0:
                            if (checkString == "anytime") {resultList.push([rule[0], 1, rule[4]]); return;};
                            if (checkString == "too early" || checkString == "too late") {resultList.push([rule[0], 2, rule[4]]); return;};
                            if (checkString == "stopped too soon" || checkString == "applied too long") {resultList.push([rule[0], 3, rule[4]]); return;};
                            break;
                        case 1:
                            if (checkString == "not provided" || checkString == "never") {resultList.push([rule[0], 0, rule[4]]); return;};
                            break;
                        case 2:
                            if (checkString == "anytime") {resultList.push([rule[0], 1, rule[4]]); return;};
                            if (checkString == "too early" || checkString == "too late") {resultList.push([rule[0], 2, rule[4]]); return;};
                            if (checkString == "stopped too soon" || checkString == "applied too long") {resultList.push([rule[0], 3, rule[4]]); return;};
                            if (checkString == "not provided" || checkString == "never") {resultList.push([rule[0], 4, rule[4]]); return;};
                            break;
                    }
                }
            }
        })
        // if the result array remains empty, there is no rule, so push a single "No"
        if(resultList.length == 0) {
            resultList.push(["No", 0, []]);
        }
        return resultList;
    }

    /**
     * Checks if the assigned values of a rule equal the assigned values of the current row.
     * @param ruleVars The assigned values of a rule.
     * @param varVals The assigned values of the current row.
     * @returns true if all values are equal; false otherwise.
     */
    protected checkValues(ruleVars: any[], varVals: any[]): boolean {
        // a boolean to iteratively check if values have been flagged as not equal, which should end the method
        let checks: boolean = true;
        // for all variables of the rule
        for(let i = 0; i < ruleVars.length && checks; i++) {
            // get the current variable with required value
            const currentVarVal = ruleVars[i];
            // load the row's current variable names and values into separate arrays
            const theVars = varVals[0] as any[];
            const theVals = varVals[1] as any[];
            // get the index of the value pair in the row array that the current iteration wants to compare
            const index = theVars.indexOf(currentVarVal[0]);
            // use that index to compare the rule's required value with the matching row's current value
            if (currentVarVal[1] != theVals[index]) {checks = false;}
        }
        return checks;
    }

        
    /**
     * Creates a listener for a given selection element which re-initializes the table element
     * when the currently selected option changes.
     * @param selector The given HTMLSelectorElement.
     * @param action Should be set to true if selector contains the control action select element.
     * Should be set to false if otherwise.
     */
     protected createSelectorListener(selector : HTMLSelectElement, action: boolean) {
        // create an event listener that catches whenever the selected option changes
        selector.addEventListener('change', change => {
            // remove the old table, as it is now outdated
            const oldTable = document.getElementById("table");
            oldTable?.parentNode?.removeChild(oldTable);
            // update the variables containing the currently selected options
            if (action) {
                const selected = this.controlActions[selector.selectedIndex];
                this.currentController = selected[0];
                this.selectedAction = selected[1];
                this.setCurrentVariables();
            } else {
                this.selectedType = selector.selectedIndex;
            }
            // create a new table which will be up to date
            this.updateTable();
        });
    }
}

new Main();