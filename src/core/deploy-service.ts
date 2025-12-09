import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
// biome-ignore lint/performance/noNamespaceImport: VS Code API requires namespace import
import * as vscode from "vscode";
import type { SubAgent } from "../models/sub-agent";
import type { AutoRoutingService } from "./auto-routing-service";
import { generateCommands } from "./command-generator";
import {
  generateIndividualCommand,
  SUBAGENT_AUTO_TEMPLATE,
} from "./command-templates";
import { ensureScripts } from "./script-generator";

/**
 * Manifest file structure for .subagents/manifest.json
 */
type ManifestFile = {
  version: string;
  agents: {
    name: string;
    description: string;
    commands: { start: string; resume: string };
  }[];
};

export class DeployService {
  private readonly autoRoutingService: AutoRoutingService;

  constructor(autoRoutingService: AutoRoutingService) {
    this.autoRoutingService = autoRoutingService;
  }

  /**
   * Deploy agent to project workspace (.subagents/)
   * Creates slash commands in .agent/workflows/
   */
  async deployToProject(agent: SubAgent): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error("No open workspace. Cannot deploy to project.");
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    // Deploy to .subagents/ folder
    const subagentsDir = join(rootPath, ".subagents");
    const agentDir = join(subagentsDir, agent.name);
    const agentFile = join(agentDir, `${agent.name}.md`);
    const manifestFile = join(subagentsDir, "manifest.json");

    // 1. Create directories and scripts
    await mkdir(agentDir, { recursive: true });
    await ensureScripts(subagentsDir);

    // 2. Write instructions file
    await writeFile(agentFile, agent.instructions, "utf-8");

    // 3. Update manifest.json
    const manifest = await this._loadOrCreateManifest(manifestFile);
    this._upsertAgentInManifest(manifest, agent, subagentsDir);
    await writeFile(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");

    // 4. Create slash commands in .agent/workflows/
    await this._createProjectWorkflows(rootPath, agent, agentDir);

    // 5. Ensure auto-routing instructions in ~/.gemini/GEMINI.md
    await this.autoRoutingService.ensureAutoRoutingInstructions();
  }

  /**
   * Deploy agent to global location (~/.subagents/)
   * Creates slash commands in ~/.gemini/antigravity/global_workflows/
   */
  async deployToGlobal(agent: SubAgent): Promise<void> {
    const homeDir = homedir();

    // Deploy to ~/.subagents/ folder
    const subagentsDir = join(homeDir, ".subagents");
    const agentDir = join(subagentsDir, agent.name);
    const agentFile = join(agentDir, `${agent.name}.md`);
    const manifestFile = join(subagentsDir, "manifest.json");

    // 1. Create directories and scripts
    await mkdir(agentDir, { recursive: true });
    await ensureScripts(subagentsDir);

    // 2. Write instructions file
    await writeFile(agentFile, agent.instructions, "utf-8");

    // 3. Update manifest.json
    const manifest = await this._loadOrCreateManifest(manifestFile);
    this._upsertAgentInManifest(manifest, agent, subagentsDir);
    await writeFile(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");

    // 4. Create global slash commands
    await this._createGlobalWorkflows(homeDir, agent, agentDir);

    // 5. Ensure auto-routing instructions in ~/.gemini/GEMINI.md
    await this.autoRoutingService.ensureAutoRoutingInstructions();
  }

  /**
   * Load existing manifest or create a new one
   */
  private async _loadOrCreateManifest(
    manifestFile: string
  ): Promise<ManifestFile> {
    try {
      const content = await readFile(manifestFile, "utf-8");
      return JSON.parse(content);
    } catch (_ignored) {
      return { version: "1.0", agents: [] };
    }
  }

  /**
   * Update or add agent in manifest
   * Generates commands pointing to start.sh/resume.sh scripts
   */
  private _upsertAgentInManifest(
    manifest: ManifestFile,
    agent: SubAgent,
    subagentsDir: string
  ): void {
    const existingIndex = manifest.agents.findIndex(
      (a) => a.name === agent.name
    );

    // Generate commands pointing to scripts
    const resolvedCommands = generateCommands(
      agent.name,
      agent.vendor,
      subagentsDir
    );

    const agentEntry = {
      name: agent.name,
      description: agent.description,
      commands: resolvedCommands,
    };

    if (existingIndex !== -1) {
      manifest.agents[existingIndex] = agentEntry;
    } else {
      manifest.agents.push(agentEntry);
    }
  }

  /**
   * Create Project Slash Commands (Workflows)
   * Location: .agent/workflows/
   */
  private async _createProjectWorkflows(
    rootPath: string,
    agent: SubAgent,
    agentDir: string
  ): Promise<void> {
    const workflowsDir = join(rootPath, ".agent", "workflows");
    await mkdir(workflowsDir, { recursive: true });

    // Auto-select command
    await writeFile(
      join(workflowsDir, "subagent-auto.md"),
      SUBAGENT_AUTO_TEMPLATE,
      "utf-8"
    );

    // Individual command for this agent
    await writeFile(
      join(workflowsDir, `subagent-${agent.name}.md`),
      generateIndividualCommand(agent, agentDir),
      "utf-8"
    );
  }

  /**
   * Create Global Slash Commands (Workflows)
   * Location: ~/.gemini/antigravity/global_workflows/
   */
  private async _createGlobalWorkflows(
    homeDir: string,
    agent: SubAgent,
    agentDir: string
  ): Promise<void> {
    const workflowsDir = join(
      homeDir,
      ".gemini",
      "antigravity",
      "global_workflows"
    );
    await mkdir(workflowsDir, { recursive: true });

    // Auto-select command
    await writeFile(
      join(workflowsDir, "subagent-auto.md"),
      SUBAGENT_AUTO_TEMPLATE,
      "utf-8"
    );

    // Individual command for this agent
    await writeFile(
      join(workflowsDir, `subagent-${agent.name}.md`),
      generateIndividualCommand(agent, agentDir),
      "utf-8"
    );
  }
}
