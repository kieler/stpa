import '../css/table.css';

export class Main {

    private currentHazards: any[];
    private currentActions: any[];
    private currentVariables: any[];

    constructor() {
        console.log("started context table")
        const eventListener = (data: any) => {
            this.handleData(data);
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
     * Appends the table and selector divs to the context table's HTML.
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
            this.createTable(tableDiv, variables);
        }
        const actSelector = document.getElementById("select_action");
        if (actSelector) {
            actSelector.addEventListener('change', change => {
                this.initHTML(this.currentActions, this.currentVariables);
            });
        }
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
     * Assembles the table element.
     * @param table The HTML table element to complete.
     * @param variables The list of context variable-Ids found in the current stpa file.
     */
    private createTable(table: HTMLTableElement, variables: any[]) {
        this.createHeader(table, variables);
        this.createSubHeader(table, variables);
        this.createRows(table);
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
        const action = document.getElementById("select_action");
        if (action) {
            controlAction.innerHTML = action.innerHTML;;
        }
        controlAction.rowSpan = 2;
        header.appendChild(controlAction);
        const vars = document.createElement("th");
        vars.innerHTML = "Context Variables";
        vars.colSpan = variables.length;
        header.appendChild(vars);
        const hazardous = document.createElement("th");
        hazardous.innerHTML = "Hazardous?";
        hazardous.colSpan = 3;
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
            col.innerHTML = variable;
            subHeader.appendChild(col);
        })
        times.forEach(time => {
            let col = document.createElement('th');
            col.innerHTML = time;
            subHeader.appendChild(col);
        })
    }

    /**
     * Creates all the regular rows for the context table.
     * @param table The HTML table element to complete.
     */
    private createRows(table: HTMLTableElement) {
        const row1 = document.createElement("tr");
        table.appendChild(row1);
    }
}

new Main();