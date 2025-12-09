import type { SubAgentVendor } from "../models/sub-agent";

/**
 * Generate CLI commands based on agent name and vendor
 * Commands include 2>/dev/null to suppress stderr (thinking, exec logs)
 * and only return stdout (final answer) to the orchestrator
 */
export const generateCommands = (
  name: string,
  vendor: SubAgentVendor,
  agentDir: string
): { start: string; resume: string } => {
  const instructionsFile = `${name}.md`;

  if (vendor === "codex") {
    return {
      start: `cd "${agentDir}" && codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox "First, read ${instructionsFile}. Then: $TASK" 2>/dev/null`,
      resume: `cd "${agentDir}" && codex exec --dangerously-bypass-approvals-and-sandbox resume $SESSION_ID "$ANSWER" 2>/dev/null`,
    };
  }
  return {
    start: `cd "${agentDir}" && claude -p "First, read ${instructionsFile}. Then: $TASK" --dangerously-skip-permissions 2>/dev/null`,
    resume: `cd "${agentDir}" && claude --continue "$ANSWER" --dangerously-skip-permissions 2>/dev/null`,
  };
};
