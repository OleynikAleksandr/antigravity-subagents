import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
// biome-ignore lint/performance/noNamespaceImport: VS Code API requires namespace import
import * as vscode from "vscode";
import type { SubAgent } from "../models/sub-agent";
import { AutoRoutingService } from "./auto-routing-service";
import {
  CLAUDE_AUTO_COMMAND,
  CODEX_AUTO_COMMAND,
  generateClaudeIndividualCommand,
  generateCodexIndividualCommand,
} from "./command-templates";

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
  /**
   * Deploy agent to project workspace (.subagents/)
   * Creates slash commands for Claude in project, Codex only globally
   */
  async deployToProject(agent: SubAgent): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error("No open workspace. Cannot deploy to project.");
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const homeDir = homedir();

    // Deploy to .subagents/ folder
    const subagentsDir = join(rootPath, ".subagents");
    const agentDir = join(subagentsDir, agent.name);
    const agentFile = join(agentDir, `${agent.name}.md`);
    const manifestFile = join(subagentsDir, "manifest.json");

    // 1. Create directories
    await mkdir(agentDir, { recursive: true });

    // 2. Write instructions file
    await writeFile(agentFile, agent.instructions, "utf-8");

    // 3. Update manifest.json - resolves $AGENT_DIR to actual path
    const manifest = await this._loadOrCreateManifest(manifestFile);
    this._upsertAgentInManifest(manifest, agent, agentDir);
    await writeFile(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");

    // 4. Create slash commands
    // Codex: ONLY global (~/.codex/prompts/) - Codex doesn't support project-level prompts
    await this._createCodexCommands(homeDir, agent, agentDir);
    // Claude: project-level (.claude/commands/)
    await this._createClaudeCommands(rootPath, agent, agentDir);

    // 5. Ensure auto-routing instructions in global CLI config files
    const autoRouting = new AutoRoutingService();
    await autoRouting.ensureAutoRoutingInstructions();
  }

  /**
   * Deploy agent to global location (~/.subagents/)
   * Creates global slash commands for both CLIs
   */
  async deployToGlobal(agent: SubAgent): Promise<void> {
    const homeDir = homedir();

    // Deploy to ~/.subagents/ folder
    const subagentsDir = join(homeDir, ".subagents");
    const agentDir = join(subagentsDir, agent.name);
    const agentFile = join(agentDir, `${agent.name}.md`);
    const manifestFile = join(subagentsDir, "manifest.json");

    // 1. Create directories
    await mkdir(agentDir, { recursive: true });

    // 2. Write instructions file
    await writeFile(agentFile, agent.instructions, "utf-8");

    // 3. Update manifest.json - resolves $AGENT_DIR to actual path
    const manifest = await this._loadOrCreateManifest(manifestFile);
    this._upsertAgentInManifest(manifest, agent, agentDir);
    await writeFile(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");

    // 4. Create global slash commands for both CLIs
    await this._createCodexCommands(homeDir, agent, agentDir);
    await this._createClaudeGlobalCommands(homeDir, agent, agentDir);

    // 5. Ensure auto-routing instructions in global CLI config files
    const autoRouting = new AutoRoutingService();
    await autoRouting.ensureAutoRoutingInstructions();
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
   * Replaces $AGENT_DIR placeholder with actual path in commands
   */
  private _upsertAgentInManifest(
    manifest: ManifestFile,
    agent: SubAgent,
    agentDir: string
  ): void {
    const existingIndex = manifest.agents.findIndex(
      (a) => a.name === agent.name
    );

    // Replace $AGENT_DIR placeholder with actual path
    const resolvedCommands = {
      start: agent.commands.start.replace(/\$AGENT_DIR/g, agentDir),
      resume: agent.commands.resume.replace(/\$AGENT_DIR/g, agentDir),
    };

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
   * Create Codex slash commands (global only)
   * - subagent-auto.md (auto-select)
   * - subagent-{name}.md (individual)
   */
  private async _createCodexCommands(
    homeDir: string,
    agent: SubAgent,
    agentDir: string
  ): Promise<void> {
    const codexPromptsDir = join(homeDir, ".codex", "prompts");
    await mkdir(codexPromptsDir, { recursive: true });

    // Auto-select command
    await writeFile(
      join(codexPromptsDir, "subagent-auto.md"),
      CODEX_AUTO_COMMAND,
      "utf-8"
    );

    // Individual command for this agent
    await writeFile(
      join(codexPromptsDir, `subagent-${agent.name}.md`),
      generateCodexIndividualCommand(agent, agentDir),
      "utf-8"
    );
  }

  /**
   * Create Claude slash commands in project
   * - subagent-auto.md (auto-select)
   * - subagent-{name}.md (individual)
   */
  private async _createClaudeCommands(
    rootPath: string,
    agent: SubAgent,
    agentDir: string
  ): Promise<void> {
    const claudeCommandsDir = join(rootPath, ".claude", "commands");
    await mkdir(claudeCommandsDir, { recursive: true });

    // Auto-select command
    await writeFile(
      join(claudeCommandsDir, "subagent-auto.md"),
      CLAUDE_AUTO_COMMAND,
      "utf-8"
    );

    // Individual command for this agent
    await writeFile(
      join(claudeCommandsDir, `subagent-${agent.name}.md`),
      generateClaudeIndividualCommand(agent, agentDir),
      "utf-8"
    );
  }

  /**
   * Create Claude slash commands globally
   * - subagent-auto.md (auto-select)
   * - subagent-{name}.md (individual)
   */
  private async _createClaudeGlobalCommands(
    homeDir: string,
    agent: SubAgent,
    agentDir: string
  ): Promise<void> {
    const claudeCommandsDir = join(homeDir, ".claude", "commands");
    await mkdir(claudeCommandsDir, { recursive: true });

    // Auto-select command
    await writeFile(
      join(claudeCommandsDir, "subagent-auto.md"),
      CLAUDE_AUTO_COMMAND,
      "utf-8"
    );

    // Individual command for this agent
    await writeFile(
      join(claudeCommandsDir, `subagent-${agent.name}.md`),
      generateClaudeIndividualCommand(agent, agentDir),
      "utf-8"
    );
  }
}
