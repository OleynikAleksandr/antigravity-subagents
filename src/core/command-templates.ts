import type { SubAgent } from "../models/sub-agent";

/**
 * Generic slash command template for Codex CLI (auto-select mode)
 * Note: Codex only supports global prompts in ~/.codex/prompts/
 */
export const CODEX_AUTO_COMMAND = `---
description: SubAgent Auto - reads manifest and picks the best SubAgent for your task
argument-hint: TASK=<description>
---

# SubAgent Auto

Read \`.subagents/manifest.json\` (or \`~/.subagents/manifest.json\` for global agents).
Analyze available SubAgents and their descriptions.
Pick the best one for this task: $TASK
Execute using the agent's \`commands.start\`.
Handle follow-ups with \`commands.resume\`.
`;

/**
 * Generic slash command template for Claude Code CLI (auto-select mode)
 */
export const CLAUDE_AUTO_COMMAND = `---
description: SubAgent Auto - reads manifest and picks the best SubAgent for your task
allowed-tools: Bash, Read
---

# SubAgent Auto

$ARGUMENTS

Read \`.subagents/manifest.json\` (or \`~/.subagents/manifest.json\` for global agents).
Analyze available SubAgents and their descriptions.
Pick the best one for the task.
Execute using the agent's \`commands.start\`.
Handle follow-ups with \`commands.resume\`.
`;

/**
 * Generate individual slash command for Codex
 */
export const generateCodexIndividualCommand = (
  agent: SubAgent,
  agentDir: string
): string => {
  const resolvedStart = agent.commands.start.replace(/\$AGENT_DIR/g, agentDir);
  const resolvedResume = agent.commands.resume.replace(
    /\$AGENT_DIR/g,
    agentDir
  );

  return `---
description: Call SubAgent "${agent.name}" - ${agent.description}
argument-hint: TASK=<description>
---

# SubAgent: ${agent.name}

Execute this SubAgent with the given task.

Start command:
\`\`\`bash
${resolvedStart}
\`\`\`

Resume command (if questions are asked):
\`\`\`bash
${resolvedResume}
\`\`\`

Replace $TASK with the actual task description.
Replace $SESSION_ID and $ANSWER when resuming.
`;
};

/**
 * Generate individual slash command for Claude
 */
export const generateClaudeIndividualCommand = (
  agent: SubAgent,
  agentDir: string
): string => {
  const resolvedStart = agent.commands.start.replace(/\$AGENT_DIR/g, agentDir);
  const resolvedResume = agent.commands.resume.replace(
    /\$AGENT_DIR/g,
    agentDir
  );

  return `---
description: Call SubAgent "${agent.name}" - ${agent.description}
allowed-tools: Bash, Read
---

# SubAgent: ${agent.name}

$ARGUMENTS

Execute this SubAgent with the task from arguments.

Start command:
\`\`\`bash
${resolvedStart}
\`\`\`

Resume command (if questions are asked):
\`\`\`bash
${resolvedResume}
\`\`\`

Replace $TASK with the actual task description.
Replace $SESSION_ID and $ANSWER when resuming.
`;
};
