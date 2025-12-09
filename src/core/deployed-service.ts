import { readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
// biome-ignore lint/performance/noNamespaceImport: VS Code API requires namespace import
import * as vscode from "vscode";
import type { SubAgent, SubAgentVendor } from "../models/sub-agent";
import { AutoRoutingService } from "./auto-routing-service";

/**
 * Manifest agent entry from .subagents/manifest.json
 */
type ManifestAgent = {
  name: string;
  description: string;
  commands: { start: string; resume: string };
};

/**
 * Manifest file structure
 */
type ManifestFile = {
  version: string;
  agents: ManifestAgent[];
};

/**
 * Deployed SubAgent with source info
 */
export type DeployedSubAgent = SubAgent & {
  source: "project" | "global";
  agentDir: string;
};

/**
 * Service for reading and managing deployed SubAgents
 */
export class DeployedService {
  /**
   * Get all deployed SubAgents from project and global locations
   */
  async getDeployedAgents(): Promise<{
    project: DeployedSubAgent[];
    global: DeployedSubAgent[];
  }> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const homeDir = homedir();

    const [projectAgents, globalAgents] = await Promise.all([
      workspaceFolders?.[0]
        ? this._loadFromManifest(
            join(workspaceFolders[0].uri.fsPath, ".subagents"),
            "project"
          )
        : Promise.resolve([]),
      this._loadFromManifest(join(homeDir, ".subagents"), "global"),
    ]);

    return { project: projectAgents, global: globalAgents };
  }

  /**
   * Remove a deployed SubAgent with full cleanup
   */
  async undeployAgent(
    name: string,
    source: "project" | "global"
  ): Promise<void> {
    const baseDir = this._getBaseDir(source);
    if (!baseDir) {
      throw new Error("No workspace open for project undeploy");
    }

    const homeDir = homedir();
    const subagentsDir = join(baseDir, ".subagents");
    const agentDir = join(subagentsDir, name);
    const manifestFile = join(subagentsDir, "manifest.json");

    // 1. Remove agent directory
    await rm(agentDir, { recursive: true, force: true });

    // 2. Update manifest and check if last agent
    let remainingAgents = 0;
    try {
      const content = await readFile(manifestFile, "utf-8");
      const manifest: ManifestFile = JSON.parse(content);
      manifest.agents = manifest.agents.filter((a) => a.name !== name);
      remainingAgents = manifest.agents.length;
      await writeFile(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");
    } catch (_ignored) {
      // Manifest doesn't exist or is invalid
    }

    // 3. Remove slash commands for this agent
    await this._removeSlashCommands(name, source, homeDir, baseDir);

    // 4. If last agent, remove auto-routing and subagent-auto commands
    if (remainingAgents === 0) {
      await this._cleanupLastAgent(source, homeDir, baseDir);
    }
  }

  /**
   * Remove slash commands for a specific agent
   */
  private async _removeSlashCommands(
    name: string,
    source: "project" | "global",
    homeDir: string,
    baseDir: string
  ): Promise<void> {
    const commandFileName = `subagent-${name}.md`;

    // Codex: always in ~/.codex/prompts/
    const codexCommand = join(homeDir, ".codex", "prompts", commandFileName);
    await rm(codexCommand, { force: true });

    // Claude: depends on source
    if (source === "project") {
      // Project: .claude/commands/
      const claudeCommand = join(
        baseDir,
        ".claude",
        "commands",
        commandFileName
      );
      await rm(claudeCommand, { force: true });
    } else {
      // Global: ~/.claude/commands/
      const claudeCommand = join(
        homeDir,
        ".claude",
        "commands",
        commandFileName
      );
      await rm(claudeCommand, { force: true });
    }
  }

  /**
   * Cleanup when last agent is undeployed
   * Removes all extension-created files: manifest, scripts, log, slash commands
   */
  private async _cleanupLastAgent(
    source: "project" | "global",
    homeDir: string,
    baseDir: string
  ): Promise<void> {
    const subagentsDir = join(baseDir, ".subagents");

    // Remove start.sh, resume.sh, subagent.log, manifest.json
    await rm(join(subagentsDir, "start.sh"), { force: true });
    await rm(join(subagentsDir, "resume.sh"), { force: true });
    await rm(join(subagentsDir, "subagent.log"), { force: true });
    await rm(join(subagentsDir, "manifest.json"), { force: true });

    // Remove project workflows if project deploy
    if (source === "project") {
      const workflowsDir = join(baseDir, ".agent", "workflows");
      await rm(join(workflowsDir, "subagent-auto.md"), { force: true });
    }

    // Remove global workflows
    const globalWorkflowsDir = join(
      homeDir,
      ".gemini",
      "antigravity",
      "global_workflows"
    );
    await rm(join(globalWorkflowsDir, "subagent-auto.md"), { force: true });

    // Remove auto-routing section from global configs
    const autoRouting = new AutoRoutingService();
    await autoRouting.removeAutoRoutingInstructions();
  }

  private _getBaseDir(source: "project" | "global"): string | null {
    if (source === "global") {
      return homedir();
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders?.[0]?.uri.fsPath ?? null;
  }

  private async _loadFromManifest(
    subagentsDir: string,
    source: "project" | "global"
  ): Promise<DeployedSubAgent[]> {
    const manifestFile = join(subagentsDir, "manifest.json");

    try {
      const content = await readFile(manifestFile, "utf-8");
      const manifest: ManifestFile = JSON.parse(content);

      const agents: DeployedSubAgent[] = [];

      for (const entry of manifest.agents) {
        const agentDir = join(subagentsDir, entry.name);
        const instructionsFile = join(agentDir, `${entry.name}.md`);

        let instructions = "";
        try {
          instructions = await readFile(instructionsFile, "utf-8");
        } catch (_ignored) {
          // Instructions file missing
        }

        // Detect vendor from command
        const vendor: SubAgentVendor = entry.commands.start.includes("codex")
          ? "codex"
          : "claude";

        agents.push({
          id: `deployed-${source}-${entry.name}`,
          name: entry.name,
          description: entry.description,
          vendor,
          instructions,
          commands: entry.commands,
          metadata: { createdAt: "", updatedAt: "" },
          source,
          agentDir,
        });
      }

      return agents;
    } catch (_ignored) {
      return [];
    }
  }
}
