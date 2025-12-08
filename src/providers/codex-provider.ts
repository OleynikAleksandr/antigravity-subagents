import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import type { SubAgent } from "../models/sub-agent";
import type { ExecResult, IAgentProvider } from "../models/types";

const exec = promisify(execCb);

export class CodexProvider implements IAgentProvider {
  readonly id = "codex";
  readonly name = "Codex CLI";

  // CRUD is not really applicable to the CLI tool itself, but rather to the internal storage or config of the CLI.
  // For this MVP, we might treat "creating an agent" in CodexProvider as "configuring a profile" or just no-op if we manage agents in our own LibraryService.
  // The architecture implies we define agents *in our extension* and just use the Provider to *execute* them.
  // So CRUD methods here might be no-ops or strictly for syncing with the CLI's native config if it has one.
  // Given we built LibraryService, we probably rely on that for storage.
  // Let's implement them as no-ops or "Not Implemented" for now, as the extension manages the agent definitions.

  createAgent(_agent: SubAgent): Promise<void> {
    // No-op: We store agents in LibraryService
    return Promise.resolve();
  }

  readAgent(_name: string): Promise<SubAgent | null> {
    return Promise.resolve(null);
  }

  updateAgent(_agent: SubAgent): Promise<void> {
    return Promise.resolve();
  }

  deleteAgent(_name: string): Promise<void> {
    return Promise.resolve();
  }

  listAgents(): Promise<SubAgent[]> {
    return Promise.resolve([]);
  }

  async execAgent(_name: string, task: string): Promise<ExecResult> {
    try {
      // Example: codex run --agent <name> "<task>"
      // Or if we pass instructions directly: codex run --instructions "..." "<task>"
      // For MVP let's assume valid `codex` command presence and simple mapping.

      const command = `codex run --model o1-preview --prompt "${task}"`;
      // Note: Real implementation depends on how valid codex CLI works.

      const { stdout, stderr } = await exec(command);

      return {
        success: true,
        output: stdout,
        error: stderr ? stderr : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
