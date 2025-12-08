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
 *
 * @example
 * {
 *   id: "abc123",
 *   name: "translator",
 *   description: "Translates text between languages. Use for: translate, переведи, перевод.",
 *   vendor: "codex",
 *   instructions: "# Translator\n\nYou are a translation assistant...",
 *   commands: {
 *     start: "cd \"$CWD\" && codex exec ...",
 *     resume: "cd \"$CWD\" && codex exec resume ..."
 *   },
 *   metadata: { createdAt: "...", updatedAt: "..." }
 * }
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
