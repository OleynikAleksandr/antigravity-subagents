// biome-ignore lint/performance/noNamespaceImport: VS Code API
import * as vscode from "vscode";
import type { DeployService } from "../core/deploy-service";
import type { DeployedService } from "../core/deployed-service";
import type { ExportImportService } from "../core/export-import-service";
import type { SubAgentService } from "../core/sub-agent-service";
import { MessageHandlers } from "./message-handlers";

export type WebviewProviderOptions = {
  extensionUri: vscode.Uri;
  subAgentService: SubAgentService;
  deployService: DeployService;
  deployedService: DeployedService;
  exportImportService: ExportImportService;
};

export class WebviewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "antigravity-subagents.webview";
  private _view?: vscode.WebviewView;
  private readonly _extensionUri: vscode.Uri;
  private readonly _handlers: MessageHandlers;

  constructor(options: WebviewProviderOptions) {
    this._extensionUri = options.extensionUri;
    this._handlers = new MessageHandlers({
      subAgentService: options.subAgentService,
      deployService: options.deployService,
      deployedService: options.deployedService,
      exportImportService: options.exportImportService,
      postMessage: (cmd, payload) => this._postMessage(cmd, payload),
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    this._setupMessageHandler(webviewView);
  }

  private _setupMessageHandler(webviewView: vscode.WebviewView) {
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case "agent.list":
          await this._handlers.handleAgentList();
          break;
        case "agent.create":
          await this._handlers.handleAgentCreate(data.payload);
          break;
        case "agent.update":
          await this._handlers.handleAgentUpdate(data.payload);
          break;
        case "agent.delete":
          await this._handlers.handleAgentDelete(data.payload.id);
          break;
        case "agent.deploy.project":
          await this._handlers.handleDeployProject(data.payload);
          break;
        case "agent.deploy.global":
          await this._handlers.handleDeployGlobal(data.payload);
          break;
        case "agent.deploy.batch.project":
          await this._handlers.handleBatchDeployProject(data.payload);
          break;
        case "agent.deploy.batch.global":
          await this._handlers.handleBatchDeployGlobal(data.payload);
          break;
        case "agent.export":
          await this._handlers.handleExport(data.payload);
          break;
        case "agent.import":
          await this._handlers.handleImport();
          break;
        case "deployed.list":
          await this._handlers.handleDeployedList();
          break;
        case "deployed.undeploy":
          await this._handlers.handleUndeploy(
            data.payload.name,
            data.payload.source
          );
          break;
        case "deployed.saveToLibrary":
          await this._handlers.handleSaveToLibrary(
            data.payload.agent,
            data.payload.overwrite
          );
          break;
        case "library.checkExists":
          await this._handlers.handleCheckExists(data.payload.name);
          break;
        default:
          break;
      }
    });
  }

  private _postMessage(command: string, payload: unknown) {
    if (this._view) {
      this._view.webview.postMessage({ command, payload });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const assetsUri = vscode.Uri.joinPath(
      this._extensionUri,
      "out",
      "webview",
      "assets"
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsUri, "index.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(assetsUri, "index.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link rel="stylesheet" type="text/css" href="${styleUri}" />
        <title>SubAgent Manager</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
