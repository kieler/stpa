import { inject, injectable, postConstruct } from "inversify";
import { Action, UpdateModelAction } from "sprotty-protocol";
import { Registry } from "../base/registry";
import { VsCodeApi } from "sprotty-vscode-webview/lib/services";
import { ICommand } from "sprotty";
import { RenderOption, TransformationOptionType } from "./option-models";
import { SelectCutSetAction, SendCutSetAction } from "./actions";
import { flagHighlightedFta } from "../helper-methods";


export class DropDownMenuOption implements RenderOption{
    static readonly ID: string = 'cut-sets';
    static readonly NAME: string = 'Cut Sets';
    readonly id: string = DropDownMenuOption.ID;
    readonly currentId:string = DropDownMenuOption.ID;
    readonly name: string = DropDownMenuOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.DROPDOWN;
    availableValues: { displayName: string; id: string }[] = [{displayName: "---", id: "---"}];
    readonly initialValue: { displayName: string; id: string } = {displayName: "---", id: "---"};
    currentValue = {displayName: "---", id: "---"};
}


export interface RenderOptionType {
    readonly ID: string,
    readonly NAME: string,
    new(): RenderOption,
}


/** {@link Registry} that stores and updates different render options. */
@injectable()
export class CutSetsRegistry extends Registry{

    private _options: Map<string, RenderOption> = new Map();
    private selectedCutSet:string = "";
    private ftaHightlighting = false;

    @inject(VsCodeApi) private vscodeApi: VsCodeApi;

    constructor(){
        super();
    }
    


    handle(action: Action): void | Action | ICommand{
        if(SendCutSetAction.isThisAction(action)){
            //this.vscodeApi.postMessage(action.cutSets);
            const dropDownOption = new DropDownMenuOption();
            for(const entry of action.cutSets){
                dropDownOption.availableValues.push({displayName: entry.id , id: entry.id});
            }

            this._options.set('cut-sets', dropDownOption);
            this.notifyListeners();
        }else if(SelectCutSetAction.isThisAction(action)){
            this.selectedCutSet = action.id;
            this.ftaHightlighting = true;
            this.highlightSelectedNodes(this.selectedCutSet);

        }
        return UpdateModelAction.create([], { animate: false, cause: action });
    }

    get allOptions():RenderOption[]{
        return Array.from(this._options.values());
    }
    

    highlightSelectedNodes(selectedCutSet:string):void{
        const selectedSet = selectedCutSet.slice(1,-1); // remove the brackets []
        if(selectedSet === '-'){
            this.ftaHightlighting = false;
        }

        const componentsToHighlight = selectedSet.split(",");
        flagHighlightedFta(componentsToHighlight);
    }
    getFtaHightlighting():boolean{
        return this.ftaHightlighting;
    }
}