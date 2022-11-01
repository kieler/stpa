import './css/table.css';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Main {

    // variables to save the language-server data in
    protected currentRules: any[];
    protected currentActions: any[];
    protected currentVariables: any[];

    // array used for a recursive method;
    // is probably redundant and could be integrated into said method as a local variable,
    // but I'll leave it for now
    protected callBack: any[] = [];

    // variables to store the currently selected options of the select elements in
    protected selectedAction: any;
    protected currentController: any;
    protected selectedType: number = 0;
    protected currentContext : any[];
    protected selIndexA: number = 0;

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
        //TODO: make more generic
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
        const mainDiv = document.getElementById('Context-Table_container');
        // TODO: use jsx and table webview
        // TODO: mage numbers as class variables
        if (mainDiv) {
            const oldSelector = document.getElementById("select_action");
            oldSelector?.parentNode?.removeChild(oldSelector);
            // Create a selector element for selecting a control action
            const actionDesc = document.createElement("pre");
            actionDesc.textContent = "Choose a Control Action:";
            actionDesc.style.position = "absolute";
            actionDesc.style.left = "10px";
            mainDiv.appendChild(actionDesc);
            const selector = document.createElement("select");
            // Call method to apply all the option elements to the select element.
            const actions = this.createActionHTMLs();
            this.createSelector(selector, actions);
            mainDiv.appendChild(selector);
            selector.id = "select_action";
            selector.selectedIndex = this.selIndexA;
            selector.style.position = "absolute";
            selector.style.top = "11px";
            selector.style.left = "210px";
            const selected = this.currentActions[selector.selectedIndex];
            this.currentController = selected[0];
            this.selectedAction = selected[1];
            this.getCurrentContext();
            const oldTypeSel = document.getElementById("select_type");
            oldTypeSel?.parentNode?.removeChild(oldTypeSel);
            const typeDesc = document.createElement("pre");
            typeDesc.textContent = "Choose a Type:";
            typeDesc.style.position = "absolute";
            typeDesc.style.top = "40px";
            typeDesc.style.left = "10px";
            mainDiv.appendChild(typeDesc);
            // Create a select element for selecting the action type.
            const typeSelector = document.createElement("select");
            // The type "both" depicts both prior types in one table.
            const providedList = ["provided", "not provided", "both"];
            // Call method to apply all the option elements to the select element.
            this.createSelector(typeSelector, providedList);
            typeSelector.selectedIndex = this.selectedType;
            typeSelector.id = "select_type";
            typeSelector.style.position = "absolute";
            typeSelector.style.top = "51px";
            typeSelector.style.left = "130px";
            mainDiv.appendChild(typeSelector);
            const oldTable = document.getElementById("table");
            oldTable?.parentNode?.removeChild(oldTable);
            // Call method to create the table.
            this.createTable(mainDiv);
            // Call methods to create listeners on the select elements.
            this.createSelectorListener(mainDiv, selector, true);
            this.createSelectorListener(mainDiv, typeSelector, false);
        }
    }

    protected getCurrentContext() {
        for(let i = 0; i < this.currentVariables.length; i++) {
            const currentEntry = this.currentVariables[i];
            if (currentEntry[0] == this.currentController) {
                this.currentContext = currentEntry[1];
                return
            }
        }
    }

    protected createActionHTMLs() {
        let actions : any[] = [];
        this.currentActions.forEach(current => {
            let combineStr = current[0] + "." + current[1];
            actions.push(combineStr);
        })
        return actions;
    }
    
    /**
     * Creates a listener for a given selection element which re-initializes the table element
     * when the currently selected option changes.
     * @param mainDiv The parent Div element of the table element.
     * @param selector The given HTMLSelectorElement.
     * @param action Should be set to true if selector contains the control action select element.
     * Should be set to false if otherwise.
     */
    protected createSelectorListener(mainDiv: HTMLElement, selector : HTMLSelectElement, action: boolean) {
        // create an event listener that catches whenever the selected option changes
        selector.addEventListener('change', change => {
            // remove the old table, as it is now outdated
            const oldTable = document.getElementById("table");
            oldTable?.parentNode?.removeChild(oldTable);
            // update the variables containing the currently selected options
            if (action) {
                this.selIndexA = selector.selectedIndex;
                const selected = this.currentActions[selector.selectedIndex];
                this.currentController = selected[0];
                this.selectedAction = selected[1];
                this.getCurrentContext();
            } else {
                this.selectedType = selector.selectedIndex;
            }
            // create a new table which will be up to date
            this.createTable(mainDiv);
        });
    }

    /**
     * Assembles a context-table specific HTML selection element.
     * @param selector The selection element to assemble.
     * @param options A list of options to add.
     */
    protected createSelector(selector: HTMLSelectElement, options: any[]) {
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
    protected createSubElements(parent: HTMLElement, children: any[], elementType: string) {
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
     */
    protected createTable(mainDiv: HTMLElement) {
        // TODO: jsx and teble webview
        const tableDesc = document.createElement("pre");
        tableDesc.textContent = "Hover over the hazards to see their associated rules!";
        tableDesc.style.position = "absolute";
        tableDesc.style.top = "90px";
        mainDiv.appendChild(tableDesc);
        // create a table element and append it to the main Div
        const tableDiv = document.createElement("table");
        tableDiv.id = "table";
        tableDiv.style.position = "absolute";
        tableDiv.style.top = "80px";
        mainDiv.appendChild(tableDiv);
        // call method to create the header row
        this.createHeader(tableDiv);
        // call method to create the subheader row
        this.createSubHeader(tableDiv);
        // filter only the value arrays for each variable out of currentContext and append them all to an array.
        if(this.currentContext.length > 0) {
            let varVals : any[] = [];
            this.currentContext.forEach(variable => {
                varVals.push(variable[1]);
            })
            // Call method to recursively create a row for each possible context
            this.getCurrentValList(tableDiv, 0, varVals);
        } else {
            this.createRow(tableDiv, []);
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
        if (this.currentContext.length > 0) {
            const vars = document.createElement("th");
            vars.innerHTML = "Context Variables";
            vars.colSpan = this.currentContext.length;
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
        if (this.currentContext.length > 0) {
            this.currentContext.forEach(variable => {
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
            const currentVar = this.currentContext[i];
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
        this.currentRules.forEach(rule => {
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
}

new Main();