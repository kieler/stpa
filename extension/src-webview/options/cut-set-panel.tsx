/** @jsx html */
import { SidebarPanel } from "../sidebar";
import { html } from "sprotty"; 
import { DISymbol } from "../di.symbols";
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { FeatherIcon } from '../feather-icons-snabbdom/feather-icons-snabbdom';
import { CutSetsRegistry } from "./cut-set-registry";
import { OptionsRenderer } from "./options-renderer";

@injectable()
export class CutSetPanel extends SidebarPanel{


    @inject(DISymbol.CutSetsRegistry) private cutSetsRegistry: CutSetsRegistry;
    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;



    @postConstruct()
    init():void{
        this.cutSetsRegistry.onChange(() => this.update());
    }
    get id(): string {
        return "cut-set-panel";
    }

    get title(): string {
        return "Cut sets";
    }

    render(): VNode {
        return (
            <div>
                <div class-options__section="true">
                    <h5 class-options__heading="true">Cut sets</h5>
                    {this.optionsRenderer.renderRenderOptions(
                        this.cutSetsRegistry.allOptions
                    )}
                </div>
            </div>
        );
    }

    get icon(): VNode {
        return <FeatherIcon iconId={"edit-2"}/>;
    }
}