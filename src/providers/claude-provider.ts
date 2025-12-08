import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import type { SubAgent } from "../models/sub-agent";
import type { ExecResult, IAgentProvider } from "../models/types";

const exec = promisify(execCb);

export class ClaudeProvider implements IAgentProvider {
  readonly id = "claude";
  readonly name = "Claude Code CLI";

  createAgent(_agent: SubAgent): Promise<void> {
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
      // Assuming 'claude' CLI is installed and available
      // Example: claude --prompt "task"
      // Or: claude run "task"
      // Assuming `claude` is the command.

      const command = `claude --prompt "${task}"`;

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
