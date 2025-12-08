import { randomUUID } from "node:crypto";
// biome-ignore lint/performance/noNamespaceImport: VS Code API
import * as vscode from "vscode";
import type { DeployService } from "../core/deploy-service";
import type { DeployedService } from "../core/deployed-service";
import type { ExportImportService } from "../core/export-import-service";
import type { SubAgentService } from "../core/sub-agent-service";
import type { SubAgent } from "../models/sub-agent";

export type MessageHandlerDeps = {
  subAgentService: SubAgentService;
  deployService: DeployService;
  deployedService: DeployedService;
  exportImportService: ExportImportService;
  postMessage: (command: string, payload: unknown) => void;
};

/**
 * Message handlers for webview commands
 */
export class MessageHandlers {
  private readonly _deps: MessageHandlerDeps;

  constructor(deps: MessageHandlerDeps) {
    this._deps = deps;
  }

  async handleAgentList() {
    const agents = await this._deps.subAgentService.getAgents();
    this._deps.postMessage("agent.list.result", agents);
  }

  async handleAgentCreate(agent: SubAgent) {
    await this._deps.subAgentService.createAgent(agent);
    vscode.window.showInformationMessage(`SubAgent ${agent.name} created!`);
    await this.handleAgentList();
  }

  async handleAgentUpdate(agent: SubAgent) {
    await this._deps.subAgentService.updateAgent(agent);
    vscode.window.showInformationMessage(`SubAgent ${agent.name} updated!`);
    await this.handleAgentList();
  }

  async handleAgentDelete(id: string) {
    await this._deps.subAgentService.deleteAgent(id);
    vscode.window.showInformationMessage("SubAgent deleted!");
    await this.handleAgentList();
  }

  async handleDeployProject(agent: SubAgent) {
    try {
      await this._deps.deployService.deployToProject(agent);
      vscode.window.showInformationMessage(
        `SubAgent ${agent.name} deployed to Project!`
      );
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to deploy: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  async handleDeployGlobal(agent: SubAgent) {
    try {
      await this._deps.deployService.deployToGlobal(agent);
      vscode.window.showInformationMessage(
        `SubAgent ${agent.name} deployed Globally!`
      );
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to deploy: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  /**
   * Deploy multiple agents sequentially (prevents race condition)
   */
  async handleBatchDeployProject(agents: SubAgent[]) {
    try {
      for (const agent of agents) {
        await this._deps.deployService.deployToProject(agent);
      }
      vscode.window.showInformationMessage(
        `${agents.length} SubAgent(s) deployed to Project!`
      );
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to deploy: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  /**
   * Deploy multiple agents sequentially (prevents race condition)
   */
  async handleBatchDeployGlobal(agents: SubAgent[]) {
    try {
      for (const agent of agents) {
        await this._deps.deployService.deployToGlobal(agent);
      }
      vscode.window.showInformationMessage(
        `${agents.length} SubAgent(s) deployed Globally!`
      );
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to deploy: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  async handleExport(agent: SubAgent) {
    try {
      await this._deps.exportImportService.exportAgent(agent);
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to export: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  async handleImport() {
    try {
      const agent = await this._deps.exportImportService.importAgent();
      if (agent) {
        await this._deps.subAgentService.createAgent(agent);
        vscode.window.showInformationMessage(
          `SubAgent "${agent.name}" imported!`
        );
        await this.handleAgentList();
      }
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to import: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  async handleDeployedList() {
    const deployed = await this._deps.deployedService.getDeployedAgents();
    this._deps.postMessage("deployed.list.result", deployed);
  }

  async handleUndeploy(name: string, source: "project" | "global") {
    try {
      await this._deps.deployedService.undeployAgent(name, source);
      vscode.window.showInformationMessage(`SubAgent ${name} undeployed!`);
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to undeploy: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  async handleSaveToLibrary(agent: SubAgent, overwrite: boolean) {
    try {
      const existingAgents = await this._deps.subAgentService.getAgents();
      const existing = existingAgents.find((a) => a.name === agent.name);

      if (existing && !overwrite) {
        vscode.window.showWarningMessage(
          `SubAgent "${agent.name}" already exists. Use overwrite option.`
        );
        return;
      }

      const libraryAgent: SubAgent = {
        id: existing?.id || randomUUID(),
        name: agent.name,
        description: agent.description,
        vendor: agent.vendor,
        instructions: agent.instructions,
        commands: agent.commands,
        metadata: {
          createdAt: existing?.metadata.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      if (existing) {
        await this._deps.subAgentService.updateAgent(libraryAgent);
        vscode.window.showInformationMessage(
          `SubAgent "${agent.name}" updated in Library!`
        );
      } else {
        await this._deps.subAgentService.createAgent(libraryAgent);
        vscode.window.showInformationMessage(
          `SubAgent "${agent.name}" saved to Library!`
        );
      }
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to save: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  async handleCheckExists(name: string) {
    const agents = await this._deps.subAgentService.getAgents();
    const exists = agents.some((a) => a.name === name);
    this._deps.postMessage("library.checkExists.result", { exists });
  }
}
