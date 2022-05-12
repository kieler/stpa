import { injectable } from "inversify";
import { ActionMessage } from "sprotty-protocol";
import { VscodeLspEditDiagramServer } from "sprotty-vscode-webview/lib/lsp/editing";

@injectable()
export class StpaDiagramServer extends VscodeLspEditDiagramServer {

    protected sendMessage(message: ActionMessage): void {
        console.log("send to server: " + message.action.kind)
        super.sendMessage(message)
    }

}