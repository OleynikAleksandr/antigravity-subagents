import type { SubAgentVendor } from "../models/sub-agent";

/**
 * Generate CLI commands that invoke start.sh and resume.sh scripts
 * Scripts handle logging (stderr → subagent.log) internally
 *
 * @param name - Agent name
 * @param vendor - "codex" or "claude"
 * @param subagentsDir - Path to .subagents/ directory (where scripts are located)
 */
export const generateCommands = (
  name: string,
  vendor: SubAgentVendor,
  subagentsDir: string
): { start: string; resume: string } => ({
  start: `"${subagentsDir}/start.sh" ${vendor} ${name} "$TASK"`,
  resume: `"${subagentsDir}/resume.sh" ${vendor} ${name} $SESSION_ID "$ANSWER"`,
});
