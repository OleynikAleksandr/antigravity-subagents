import type * as vscode from "vscode";
import type { SubAgent } from "../models/sub-agent";
import type { ExecResult, IAgentProvider } from "../models/types";
import { LibraryService } from "./library-service";

export class SubAgentService {
  private readonly _library: LibraryService;
  private readonly _providers: Map<string, IAgentProvider> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this._library = new LibraryService(context);
  }

  // Provider Management
  registerProvider(provider: IAgentProvider) {
    if (this._providers.has(provider.id)) {
      console.warn(
        `Provider ${provider.id} is already registered. Overwriting.`
      );
    }
    this._providers.set(provider.id, provider);
  }

  getProvider(id: string): IAgentProvider | undefined {
    return this._providers.get(id);
  }

  getRegisteredProviders(): string[] {
    return Array.from(this._providers.keys());
  }

  // Agent Management (delegates to LibraryService)
  async createAgent(agent: SubAgent): Promise<void> {
    // Validation logic could go here
    if (!agent.name) {
      throw new Error("Agent name is required");
    }
    await this._library.saveAgent(agent);
  }

  getAgents(): Promise<SubAgent[]> {
    return this._library.getAgents();
  }

  async updateAgent(agent: SubAgent): Promise<void> {
    await this._library.saveAgent(agent);
  }

  async deleteAgent(id: string): Promise<void> {
    await this._library.deleteAgent(id);
  }

  // Execution Logic (Facade)
  async executeTask(agentId: string, task: string): Promise<ExecResult> {
    const agents = await this.getAgents();
    const agent = agents.find((a) => a.id === agentId);

    if (!agent) {
      return { success: false, error: `Agent with ID ${agentId} not found` };
    }

    // Get the provider for this agent's vendor
    const provider = this.getProvider(agent.vendor);

    if (!provider) {
      return {
        success: false,
        error: `Provider "${agent.vendor}" is not registered for agent ${agent.name}`,
      };
    }

    try {
      // Delegate execution to the provider
      return await provider.execAgent(agent.name, task);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
