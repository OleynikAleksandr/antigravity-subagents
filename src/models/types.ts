import type { SubAgent } from "./sub-agent";

export type ExecResult = {
  success: boolean;
  output?: string;
  error?: string;
};

export type IAgentProvider = {
  readonly id: string;
  readonly name: string;

  // CRUD operations
  createAgent(agent: SubAgent): Promise<void>;
  readAgent(name: string): Promise<SubAgent | null>;
  updateAgent(agent: SubAgent): Promise<void>;
  deleteAgent(name: string): Promise<void>;
  listAgents(): Promise<SubAgent[]>;

  // Execution
  execAgent(name: string, task: string): Promise<ExecResult>;
};
