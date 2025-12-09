---
description: Auto-select and run the best SubAgent for the task
---

# SubAgent Auto-Routing

Read `.subagents/manifest.json` (or `~/.subagents/manifest.json` for global agents).
Analyze available SubAgents and their descriptions.
Pick the best one for this task.
Execute using the agent's `commands.start`.
Handle follow-ups with `commands.resume`.
