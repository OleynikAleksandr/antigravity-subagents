// Duplicate of src/models/sub-agent.ts in extension
// Ideally we would share this, but for MVP separate file is fine.

/**
 * CLI vendor that will execute this SubAgent
 */
export type SubAgentVendor = "codex" | "claude";

/**
 * Commands generated for calling the SubAgent
 */
export type SubAgentCommands = {
  /** Command to start a new task */
  start: string;
  /** Command to resume/continue an existing session */
  resume: string;
};

/**
 * SubAgent metadata for storage
 */
export type SubAgentMetadata = {
  createdAt: string;
  updatedAt: string;
};

/**
 * SubAgent model - represents a configured sub-agent for delegation
 */
export type SubAgent = {
  /** Unique identifier */
  id: string;
  /** Agent name (used as folder name) */
  name: string;
  /** Description including keywords for auto-routing */
  description: string;
  /** CLI vendor that will execute this agent */
  vendor: SubAgentVendor;
  /** Markdown instructions for the agent */
  instructions: string;
  /** Generated CLI commands */
  commands: SubAgentCommands;
  /** Storage metadata */
  metadata: SubAgentMetadata;
};
