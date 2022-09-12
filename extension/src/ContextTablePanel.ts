import * as vscode from "vscode";
import { URI } from "vscode-languageclient";

export class ContextTablePanel {
  // Track the current panel. Only allow a single panel to exist. 
  public static currentPanel: ContextTablePanel | undefined;
  public static readonly viewType = "context-table";
  public static currentUri: URI | undefined;
  public static currentData: any[];

  // Promise stuff
  private resolveWebviewReady: () => void;
  private readonly webviewReady = new Promise<void>((resolve) => this.resolveWebviewReady = resolve);

  // Constructor variables.
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;

  private _disposables: vscode.Disposable[] = [];

  protected scriptUri: vscode.Uri;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, scriptUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.scriptUri = scriptUri;

    panel.webview.onDidReceiveMessage(message => this.receiveFromWebview(message));
    // Initialize the webview.
    this._update();
    // Listen for the panel being disposed.
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  ready(): Promise<void> {
    this.resolveWebviewReady;
    return this.webviewReady;
  }

  // Main call method.
  public static createOrShow(extensionUri: vscode.Uri, scriptUri: vscode.Uri, commandArgs: any) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    // If we already have a panel, show it.
    if (ContextTablePanel.currentPanel) {
      ContextTablePanel.currentPanel._panel.reveal(column);
      ContextTablePanel.currentPanel._update();
      return;
    }
    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ContextTablePanel.viewType,
      "Context Table",
      vscode.ViewColumn.Two,
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `css` directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "src"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );
    if (commandArgs[0] instanceof vscode.Uri && commandArgs[0].path.endsWith('.stpa')) {
      this.currentUri = (commandArgs[0] as vscode.Uri).toString();
    }
    
    panel.webview.options = {
      enableScripts: true
    };
    panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, height=device-height">
            <title>Context-Table</title>
        </head>
        <body>
            <div id="main_container" style="height: 100%;"></div>
            <script> const vscode = acquireVsCodeApi();</script>
            <script src="${panel.webview.asWebviewUri(scriptUri).toString()}"></script>
        </body>
    </html>`;
    ContextTablePanel.currentPanel = new ContextTablePanel(panel, extensionUri, scriptUri);
  }

  // Kills off the current panel.
  public static kill() {
    ContextTablePanel.currentPanel?.dispose();
    ContextTablePanel.currentPanel = undefined;
  }

  // Revives a defined panel.
  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, scriptUri: vscode.Uri) {
    ContextTablePanel.currentPanel = new ContextTablePanel(panel, extensionUri, scriptUri);
    // Exists so the _extensionUri variable is read at least once.
    ContextTablePanel.currentPanel._extensionUri.path;
  }

  public static notify() {
    return this.currentUri;
  }

  public static getData(list : any[]) {
    console.log(list.length);
    if (list.length == 3) {
      this.currentData = list;
      ContextTablePanel.currentPanel?._update();
    } else {
      console.log("Data has wrong format. List length should be 3, but is " + list.length);
    }
  }

  // Disposes of the panel and all its related data.
  public dispose() {
    ContextTablePanel.currentPanel = undefined;

    // Dispose of no longer needed data.
    this._panel.dispose();
    while (this._disposables.length) {
      const trash = this._disposables.pop();
      if (trash) {
        trash.dispose();
      }
    }
  }

  // Update function. Used for generating and maintaining the view's content.
  private async _update() {
    const webview = this._panel.webview;
    
    //webview.onDidReceiveMessage(message => this.receiveFromWebview(message));
    await this.ready();
    this.sendToWebview(webview, ContextTablePanel.currentData);
  }

  sendToWebview(webview: vscode.Webview, data: any) {
    webview.postMessage(data);
  }

  protected async receiveFromWebview(message: any) {
    console.log("Received from context table webview");
    if (message.readyMessage) {
        this.resolveWebviewReady();
    } 
  } 

  /* private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the style sheets to be used for the HTML data
    const resetterUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "src",
      "resetter.css"
    ));
    const vscStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "src",
      "vscode-style.css"
    ));
    const tableStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "src",
      "table.css"
    ));
    // HTML
    return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
		    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${tableStyleUri}" rel="stylesheet">
		  </head>
      <body>
        <div id="main_container" style="height: 100%;"></div>
        <script src="${webview.asWebviewUri(this.scriptUri).toString()}></script>
		  </body>
		</html>`;
  } */
}