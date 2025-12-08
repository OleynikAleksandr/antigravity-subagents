import type { SubAgent } from "../models/sub-agent";

/**
 * Generic slash command template for Antigravity (Gemini CLI)
 * Used for auto-routing via subagent-auto.md
 */
export const SUBAGENT_AUTO_TEMPLATE = `---
description: Auto-select and run the best SubAgent for the task
---
# SubAgent Auto-Routing

Read \`.subagents/manifest.json\` (or \`~/.subagents/manifest.json\` for global agents).
Analyze available SubAgents and their descriptions.
Pick the best one for this task.
Execute using the agent's \`commands.start\`.
Handle follow-ups with \`commands.resume\`.
`;

/**
 * Generate individual slash command for Antigravity
 * Used for specific agent commands (e.g. subagent-translator.md)
 */
export const generateIndividualCommand = (
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
`;
};
