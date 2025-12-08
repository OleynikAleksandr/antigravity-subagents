import type * as vscode from "vscode";
import type { SubAgent } from "../models/sub-agent";

export class LibraryService {
  private readonly STORAGE_KEY = "antigravity-subagents.library.agents";
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async getAgents(): Promise<SubAgent[]> {
    // Simulate async operation for future extensibility (e.g. file system)
    await Promise.resolve();

    const data = this.context.globalState.get<string>(this.STORAGE_KEY);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data) as SubAgent[];
    } catch (error) {
      console.error("Failed to parse agents from storage", error);
      return [];
    }
  }

  async saveAgent(agent: SubAgent): Promise<void> {
    const agents = await this.getAgents();
    const index = agents.findIndex((a) => a.id === agent.id);

    if (index !== -1) {
      agents[index] = agent;
    } else {
      agents.push(agent);
    }

    await this.context.globalState.update(
      this.STORAGE_KEY,
      JSON.stringify(agents)
    );
  }

  async deleteAgent(id: string): Promise<void> {
    const agents = await this.getAgents();
    const newAgents = agents.filter((a) => a.id !== id);
    await this.context.globalState.update(
      this.STORAGE_KEY,
      JSON.stringify(newAgents)
    );
  }
}
