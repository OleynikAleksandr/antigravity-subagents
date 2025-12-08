// biome-ignore lint/performance/noNamespaceImport: VS Code API
import * as vscode from "vscode";
import { DeployService } from "./core/deploy-service";
import { DeployedService } from "./core/deployed-service";
import { ExportImportService } from "./core/export-import-service";
import { SubAgentService } from "./core/sub-agent-service";
import { ClaudeProvider } from "./providers/claude-provider";
import { CodexProvider } from "./providers/codex-provider";
import { WebviewProvider } from "./webview/webview-provider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "antigravity-subagents" is now active!');

  // Initialize Core Services
  const subAgentService = new SubAgentService(context);
  const deployService = new DeployService();
  const deployedService = new DeployedService();
  const exportImportService = new ExportImportService();

  // Register Providers
  subAgentService.registerProvider(new CodexProvider());
  subAgentService.registerProvider(new ClaudeProvider());

  // Initialize UI
  const provider = new WebviewProvider({
    extensionUri: context.extensionUri,
    subAgentService,
    deployService,
    deployedService,
    exportImportService,
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      WebviewProvider.viewType,
      provider
    )
  );

  const disposable = vscode.commands.registerCommand(
    "antigravity-subagents.open",
    () => {
      vscode.commands.executeCommand(
        "workbench.view.extension.antigravity-subagents-view"
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // Deactivation logic will go here
}
