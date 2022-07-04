import * as vscode from "vscode";

export class ContextTablePanel {
  // Track the current panel. Only allow a single panel to exist. 
  public static currentPanel: ContextTablePanel | undefined;
  public static readonly viewType = "context-table";

  // Constructor variables.
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Initialize the webview.
    this._update();
    // Listen for the panel being disposed.
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  // Main call method.
  public static createOrShow(extensionUri: vscode.Uri) {
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
          vscode.Uri.joinPath(extensionUri, "src")
        ],
      }
    );
    ContextTablePanel.currentPanel = new ContextTablePanel(panel, extensionUri);
  }

  // Kills off the current panel.
  public static kill() {
    ContextTablePanel.currentPanel?.dispose();
    ContextTablePanel.currentPanel = undefined;
  }

  // Revives a defined panel.
  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    ContextTablePanel.currentPanel = new ContextTablePanel(panel, extensionUri);
    // Exists so the _extensionUri variable is read at least once.
    ContextTablePanel.currentPanel._extensionUri.path;
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

    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the style sheets to be used for the HTML data
    /*const resetterUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "src",
      "resetter.css"
    ));
    const vscStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "src",
      "vscode-style.css"
    ));*/
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
        <label for "controlAction">Control Action</label>
        <select name = "controlAction" id = "controlAction">
          <option value = "manBrake">Manual Braking</option>
          <option value = "onBSCU">Power On BSCU</option>
          <option value = "offBSCU">Power Off BSCU</option>
        </select>
        <label for "type">, Type</label>
        <select name = "type" id = "type">
          <option value = "prov">provided</option>
          <option value = "noProv">not provided</option>
        </select>
        <button type = "button" class = "catButton">Submit</button>
        <table>
          <tr>
            <th rowspan = "2">Control Action</th>
            <th colspan = "2">Context Variables</th>
            <th colspan = "3">Hazardous?</th>
          </tr>
          <tr>
            <th>Variable A</th>
            <th>Variable B</th>
            <th>Anytime</th>
            <th>Too Early</th>
            <th>Too Late</th>
          </tr>
          <tr>
            <td>CA</td>
            <td>0</td>
            <td>0</td>
            <td>No</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
          <tr>
            <td>CA</td>
            <td>0</td>
            <td>1</td>
            <td colspan = "3">Yes</td>
          </tr>
        </table>
		  </body>
		</html>`;
  }
}