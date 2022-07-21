import '../css/table.css';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Main {

    // variables to save the language-server data in
    private currentRules: any[];
    private currentActions: any[];
    private currentVariables: any[];

    // array used for a recursive method;
    // is probably redundant and could be integrated into said method as a local variable,
    // but I'll leave it for now
    private callBack: any[] = [];

    // variables to store the currently selected options of the select elements in
    private selectedAction: any;
    private selectedType: number;

    constructor() {
        vscode.postMessage({ readyMessage: 'Context Table Webview ready' });
        console.log("started context table")
        const eventListener = (message: any) => {
            this.handleData(message.data);
        };
        window.addEventListener('message', eventListener);
    }

    /**
     * Handles the incoming data and assigns it to the correct variables needed for the class to function properly.
     * Will call the HTML init method afterwards.
     * @param data The data for creating the table contents.
     */
    protected handleData(data: any[]) {
        this.currentRules = data[0];
        this.currentActions = data[1];
        this.currentVariables = data[2];
        this.initHTML();
    }

    /**
     * Initialized the context webview and establishes necessary listeners for user interaction.
     */
    protected initHTML() {
        // Get the main DIV element that was created by the ContextTablePanel.
        const mainDiv = document.getElementById('main_container');
        if (mainDiv) {
            // Create a selector element for selecting a control action
            const selector = document.createElement("select");
            mainDiv.appendChild(selector);
            selector.id = "select_action";
            // Call method to apply all the option elements to the select element.
            this.createSelector(selector, this.currentActions);
            this.selectedAction = selector.options[selector.selectedIndex].text;
            // Create a select element for selecting the action type.
            const typeSelector = document.createElement("select");
            typeSelector.id = "select_type";
            mainDiv.appendChild(typeSelector);
            // The type "both" depicts both prior types in one table.
            const providedList = ["provided", "not provided", "both"];
            // Call method to apply all the option elements to the select element.
            this.createSelector(typeSelector, providedList);
            this.selectedType = selector.selectedIndex;
            // Call method to create the table.
            this.createTable(mainDiv, this.currentVariables);
            // Call methods to create listeners on the select elements.
            this.createSelectorListener(mainDiv, selector, true);
            this.createSelectorListener(mainDiv, typeSelector, false);
        }
    }
    
    /**
     * Creates a listener for a given selection element which re-initializes the table element
     * when the currently selected option changes.
     * @param mainDiv The parent Div element of the table element.
     * @param selector The given HTMLSelectorElement.
     * @param action Should be set to true if selector contains the control action select element.
     * Should be set to false if otherwise.
     */
    private createSelectorListener(mainDiv: HTMLElement, selector : HTMLSelectElement, action: boolean) {
        // create an event listener that catches whenever the selected option changes
        selector.addEventListener('change', change => {
            // remove the old table, as it is now outdated
            const oldTable = document.getElementById("table");
            oldTable?.parentNode?.removeChild(oldTable);
            // update the variables containing the currently selected options
            if (action) {
                this.selectedAction = selector.options[selector.selectedIndex].text;
            } else {
                this.selectedType = selector.selectedIndex;
            }
            // create a new table which will be up to date
            this.createTable(mainDiv, this.currentVariables);
        });
    }

    /**
     * Assembles a context-table specific HTML selection element.
     * @param selector The selection element to assemble.
     * @param options A list of options to add.
     */
    private createSelector(selector: HTMLSelectElement, options: any[]) {
        // make an option element for each array entry and append it to the selection element
        options.forEach(action => {
            let opt = document.createElement('option');
            opt.value = action;
            opt.innerHTML = action;
            selector.appendChild(opt);
        })
    }

    /**
     * Creates multiple children elements with a given type for a given parent element.
     * @param parent The element to which to apply the children elements to.
     * @param children Preferrably a string array, the elements of which to apply to the parent element.
     * @param elementType The type of Div element the children elements should be created with.
     */
    private createSubElements(parent: HTMLElement, children: any[], elementType: string) {
        // similar to the createSelector method, but generalized for multiple types
        children.forEach(child => {
            let newElement = document.createElement(elementType);
            newElement.innerHTML = child;
            parent.appendChild(newElement);
        })
    }

    /**
     * Creates and assembles the table element.
     * @param mainDiv The parent element to apply the table to.
     * @param variables The list of context variable-Ids found in the current stpa file.
     */
    private createTable(mainDiv: HTMLElement, variables: any[]) {
        // create a table element and append it to the main Div
        const tableDiv = document.createElement("table");
        tableDiv.id = "table";
        mainDiv.appendChild(tableDiv);
        // call method to create the header row
        this.createHeader(tableDiv, variables);
        // call method to create the subheader row
        this.createSubHeader(tableDiv, variables);
        // filter only the value arrays for each variable out of currentVariables and append them all to an array.
        let varVals : any[] = [];
        variables.forEach(variable => {
            varVals.push(variable[1]);
        })
        // Call method to recursively create a row for each possible context
        this.getCurrentValList(tableDiv, 0, varVals);
    }

    /**
     * Creates the header (first table row) of the context table.
     * @param table The HTML table element to complete.
     * @param variables The list of context variable-Ids found in the current stpa file. Uses it to determine column length of the "Context Variables" column.
     */
    private createHeader(table: HTMLTableElement, variables: any[]) {
        const header = document.createElement("tr");
        table.appendChild(header);
        const controlAction = document.createElement("th");
        controlAction.innerHTML = "Control Action";
        controlAction.rowSpan = 2;
        header.appendChild(controlAction);
        const vars = document.createElement("th");
        vars.innerHTML = "Context Variables";
        vars.colSpan = variables.length;
        header.appendChild(vars);
        const hazardous = document.createElement("th");
        hazardous.innerHTML = "Hazardous?";
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
     * @param variables The list of context variable-Ids found in the current stpa file. Appends all the Ids to the "Context Variables" column.
     */
    private createSubHeader(table: HTMLTableElement, variables: any[]) {
        const subHeader = document.createElement("tr");
        table.appendChild(subHeader);
        variables.forEach(variable => {
            let col = document.createElement('th');
            col.innerHTML = variable[0];
            subHeader.appendChild(col);
        })
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
     * Creates and appends one non-header row to the table. 
     * @param table The HTMLTableElement to apply the row to.
     * @param values The context variable values that should be written into the current row.
     */
    private createRow(table: HTMLTableElement, values: any[]) {
        const row = document.createElement("tr");
        table.appendChild(row);
        const controlAction = document.createElement("td");
        const action = <HTMLSelectElement> document.getElementById("select_action");
        const type = <HTMLSelectElement> document.getElementById("select_type");
        if(type.options[type.selectedIndex].text == "both") {
            controlAction.innerHTML = action.options[action.selectedIndex].text + " provided";
        } else {
            controlAction.innerHTML = action.options[action.selectedIndex].text + " " + type.options[type.selectedIndex].text;
        }
        row.appendChild(controlAction);
        this.createSubElements(row, values, "td");
        const varVals = this.reappendValNames(values);
        const result = this.getResult(varVals);
        switch(this.selectedType) {
            case 0:
                this.createResults(row, result, 3);
                break;
            case 1:
                const firstRes = result[0];
                const entry = document.createElement("td");
                entry.innerHTML = firstRes[0];
                row.appendChild(entry);
                break;
            case 2:
                this.createResults(row, result, 4);
                break;
        }
    }

    /**
     * Completes a non-header row with the calculated values for the "Hazardous?"-column.
     * @param parent The row to apply the values to.
     * @param result The results calculated with the getResult method.
     * @param index The number of columns the "Hazardous?"-column currently has.
     */
    private createResults(parent: HTMLTableRowElement, result: [string, number][], index: number) {
        const firstRes = result[0];
        if (firstRes[1] != 0) {
            let numbers: number[] = [];
            result.forEach(res => {
                numbers.push(res[1]);
            })
            for(let i = 1; i <= index; i++) {
                const entry = document.createElement("td");
                if (numbers.includes(i)) {
                    let index = numbers.indexOf(i);
                    let iRes = result[index];
                    entry.innerHTML = iRes[0];
                } else {
                    entry.innerHTML = "No";
                }
                parent.appendChild(entry);
            }
        } else {
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
    private getCurrentValList(table: HTMLTableElement, index: number, values: any[]) {
        let last = false;
        const currentValues = values[index];
        if(index == values.length - 1) {last = true;}
        for(let privateIndex = 0; privateIndex < currentValues.length; privateIndex++) {
            this.callBack.push(currentValues[privateIndex]);
            if(last) {
                this.createRow(table, this.callBack);
            } else {
                index++;
                this.getCurrentValList(table, index, values);
                index--;
            }
            this.callBack.pop();
        }
    }

    /**
     * Gets the variable names from the currentVariables Array
     * and returns it together with the array of the current row's values.
     * @param values The array containing the values that have been assigned to the context variables in the current row.
     * @returns An array containing both the variable-names array and the assigned-values array.
     * The indices for each variable and its assigned value sync up.
     */
    private reappendValNames(values: any[]) {
        let varVals: any[] = [];
        let currentVars: any[] = [];
        for (let i = 0; i < values.length; i++) {
            const currentVar = this.currentVariables[i];
            currentVars.push(currentVar[0]);
        }
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
    private getResult(varVals: any[]): [string, number][] {
        let resultList: [string, number][] = [];
        this.currentRules.forEach(rule => {
            if (rule[1] == this.selectedAction) {
                if (this.checkValues(rule[3], varVals)) {
                    const typeString = rule[2] as string;
                    const checkString = typeString.toLowerCase();
                    switch(this.selectedType) {
                        case 0:
                            if (checkString == "anytime") {resultList.push([rule[0], 1]); return;};
                            if (checkString == "too early" || checkString == "too late") {resultList.push([rule[0], 2]); return;};
                            if (checkString == "stopped too soon" || checkString == "applied too long") {resultList.push([rule[0], 3]); return;};
                            break;
                        case 1:
                            if (checkString == "not provided" || checkString == "never") {resultList.push([rule[0], 0]); return;};
                            break;
                        case 2:
                            if (checkString == "anytime") {resultList.push([rule[0], 1]); return;};
                            if (checkString == "too early" || checkString == "too late") {resultList.push([rule[0], 2]); return;};
                            if (checkString == "stopped too soon" || checkString == "applied too long") {resultList.push([rule[0], 3]); return;};
                            if (checkString == "not provided" || checkString == "never") {resultList.push([rule[0], 4]); return;};
                            break;
                    }
                }
            }
        })
        if(resultList.length == 0) {
            resultList.push(["No", 0]);
        }
        return resultList;
    }

    /**
     * Checks if the assigned values of a rule equal the assigned values of the current row.
     * @param ruleVars The assigned values of a rule.
     * @param varVals The assigned values of the current row.
     * @returns true if all values are equal; false otherwise.
     */
    private checkValues(ruleVars: any[], varVals: any[]): boolean {
        let checks: boolean = true;
        for(let i = 0; i < ruleVars.length && checks; i++) {
            const currentVarVal = ruleVars[i];
            const theVars = varVals[0] as any[];
            const theVals = varVals[1] as any[];
            const index = theVars.indexOf(currentVarVal[0]);
            if (currentVarVal[1] != theVals[index]) {checks = false;}
        }
        return checks;
    }
}

new Main();