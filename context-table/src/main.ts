import '../css/table.css';

interface vscode {
    postMessage(message: any): void;
}
declare const vscode: vscode;

export class Main {

    private currentHazards: any[];
    private currentActions: any[];
    private currentVariables: any[];

    private callBack: any[] = [];

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
        this.currentHazards = data[0];
        this.currentActions = data[1];
        this.currentVariables = data[2];
        this.currentHazards.length;
        this.initHTML(this.currentActions, this.currentVariables);
    }

    /**
     * Initialized the context webview and establishes necessary listeners for user interaction.
     * @param actions The list of action-Ids found in the current stpa file.
     * @param variables The list of context variable-Ids found in the current stpa file.
     */
    protected initHTML(actions: any[], variables: any[]) {
        const mainDiv = document.getElementById('main_container');
        if (mainDiv) {
            const selector = document.createElement("select");
            mainDiv.appendChild(selector);
            selector.id = "select_action";
            this.createSelector(selector, actions);
            const typeSelector = document.createElement("select");
            typeSelector.id = "select_type";
            mainDiv.appendChild(typeSelector);
            const providedList = ["provided", "not provided"];
            this.createSelector(typeSelector, providedList);
            const tableDiv = document.createElement("table");
            tableDiv.id = "table";
            mainDiv.appendChild(tableDiv);
            this.createTable(tableDiv, variables);
            this.createSelectorListener(mainDiv, selector);
            this.createSelectorListener(mainDiv, typeSelector);
        }
    }
    
    /**
     * Creates a listener for a given selection element which re-initializes the table element when the currently selected option changes.
     * @param mainDiv The parent Div element of the table element.
     * @param selector The given HTMLSelectorElement.
     */
    private createSelectorListener(mainDiv: HTMLElement, selector : HTMLSelectElement) {
        selector.addEventListener('change', change => {
            const oldTable = document.getElementById("table");
            oldTable?.parentNode?.removeChild(oldTable);
            const newTable = document.createElement("table");
            newTable.id = "table";
            mainDiv.appendChild(newTable);
            this.createTable(newTable, this.currentVariables);
        });
    }

    /**
     * Assembles a context-table specific HTML selection element.
     * @param selector The selection element to assemble.
     * @param options A list of options to add.
     */
    private createSelector(selector: HTMLSelectElement, options: any[]) {
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
        children.forEach(child => {
            let newElement = document.createElement(elementType);
            newElement.innerHTML = child;
            parent.appendChild(newElement);
        })
    }

    /**
     * Assembles the table element.
     * @param table The HTML table element to complete.
     * @param variables The list of context variable-Ids found in the current stpa file.
     */
    private createTable(table: HTMLTableElement, variables: any[]) {
        this.createHeader(table, variables);
        this.createSubHeader(table, variables);
        let varVals : any[] = [];
        variables.forEach(variable => {
            varVals.push(variable[1]);
        })
        this.getCurrentValList(table, 0, varVals);
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
        hazardous.colSpan = 3;
        header.appendChild(hazardous);
    }

    /**
     * Creates the sub-header (second table row) of the context table.
     * @param table The HTML table element to complete.
     * @param variables The list of context variable-Ids found in the current stpa file. Appends all the Ids to the "Context Variables" column.
     */
    private createSubHeader(table: HTMLTableElement, variables: any[]) {
        const subHeader = document.createElement("tr");
        const times = ["Anytime", "Too Early", "Too Late"];
        table.appendChild(subHeader);
        variables.forEach(variable => {
            let col = document.createElement('th');
            col.innerHTML = variable[0];
            subHeader.appendChild(col);
        })
        this.createSubElements(subHeader, times, "th");
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
        controlAction.innerHTML = action.options[action.selectedIndex].text + " " + type.options[type.selectedIndex].text;
        row.appendChild(controlAction);
        this.createSubElements(row, values, "td");
        // temporary until rules; will be specified by an algorithm then
        const no = document.createElement("td");
        no.innerHTML = "No"
        no.colSpan = 3;
        row.appendChild(no);
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
}

new Main();