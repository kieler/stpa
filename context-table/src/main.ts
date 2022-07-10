import '../css/resetter.css';
import '../css/table.css';
import '../css/vscode-style.css';

export class Main {

    private currentHazards: any[];

    constructor() {
        console.log("started context table")
        const eventListener = (data : any) => {
            this.handleData(data);
        };
        window.addEventListener('message', eventListener);
    }

    protected handleData(data: any[]) {
        this.currentHazards = data[0];
        this.currentHazards.length;
        this.initHTML(data[1], data[2]);
    }

    protected initHTML(data1 : any[], data2 : any[]) {
        
    }
}

new Main();