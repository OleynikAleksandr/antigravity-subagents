# Antigravity SubAgents

**VS Code Extension to empower Antigravity IDE's Orchestrator Agents to manage Sub-Agents (Codex CLI, Claude Code CLI).**

![Version](https://img.shields.io/badge/version-0.0.34-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

**Antigravity SubAgents** provides the infrastructure for **Antigravity IDE** to utilize specialized Sub-Agents. In Antigravity, multiple Main Agents can act as **Orchestrators**. This extension allows these Orchestrators to delegate tasks to Sub-Agents that execute via other CLI tools (**Codex CLI** or **Claude Code CLI**).

### Key Features

- **Orchestration** — Enables Main Agents in Antigravity to act as Orchestrators, intelligently delegating tasks.
- **Sub-Agent Vendors** — Create agents that run on **Codex CLI** or **Claude Code CLI**.
- **Focused Execution** — Sub-Agents are launched **ONLY with their specific, narrow instructions**. This ensures they stay focused on the task without the distraction of general chat history or conflicting directives.
- **Real-time Logging** — When a SubAgent runs, a Terminal window automatically opens showing formatted live output:
  - **Codex**: Verbose stderr with thinking, tool calls, and execution logs
  - **Claude**: JSONL session log parsed with colored formatting (💭 thinking, ⚡ tools, ✅ results)
  - Orchestrator receives **only the final answer** to save tokens
- **SubAgent Isolation** — SubAgents are completely isolated from user's global configuration:
  - **Codex**: Uses separate `CODEX_HOME` (blocks `~/.codex/AGENTS.md`, preserves auth)
  - **Claude**: Runs with `--setting-sources ""` (blocks all `CLAUDE.md` files)
- **Multi-turn Conversations** — SubAgents can ask clarifying questions; Orchestrator provides answers via `resume.sh`
- **Auto-Routing** — Automatically creates `.agent/rules/subagent-delegation-protocol.md` with routing instructions for the Orchestrator.
- **Workflow Generation** — Automatically generates Slash Commands for the Orchestrator:
  - **Global**: `~/.gemini/antigravity/global_workflows/`
  - **Project**: `<project>/.agent/workflows/`
- **Visual Editor** — Rich VS Code UI to create and manage agents.
- **Full Autonomy** — Sub-Agents run with unsafe flags, giving them complete freedom to execute any operations without permission prompts.

![Create SubAgent UI](docs/images/create-subagent-ui.png)

## Prerequisites

Before using this extension, ensure you have the following installed and authenticated:

- **Codex CLI**: Required if you plan to use Codex-based Sub-Agents.
- **Claude Code CLI**: Required if you plan to use Claude-based Sub-Agents.

Both tools must be available in your system `PATH` and fully authenticated (logged in).

## Installation

Download the latest `.vsix` release from [Releases](https://github.com/OleynikAleksandr/antigravity-subagents/releases) and install in VS Code:

1. In VS Code: `Extensions` → `...` → `Install from VSIX...`
2. Select the downloaded `.vsix` file

## Quick Start

1. **Open** SubAgent Manager from the Activity Bar (MsA icon).
2. **Create** a new SubAgent (e.g., "Translator").
   - Select Vendor: `Codex` or `Claude`.
   - Define Triggers: `translate`, `перевод`.
3. **Deploy** to **Project** (current workspace) or **Global** (system-wide).
4. **Use** in Antigravity IDE:
   - **Auto**: Just ask the Orchestrator "Translate this file..." -> It will route the task to your Sub-Agent.
   - **Manual**: Use the generated slash command (e.g., `/subagent-translator`).

### Example: Translator SubAgent

```yaml
Name: translator
Vendor: Codex
Triggers: Translates text and/or files to the specified language
Instructions: |
  You are a professional translator.
  Translate the given text to the requested language.
  Save translations next to the original files.
```

**Workflow:**
1. You ask the Orchestrator: "Translate README.md to Russian".
2. The Orchestrator reads `GEMINI.md` and finds the `translator` agent.
3. The Orchestrator delegates the task.
4. The Sub-Agent starts with **only the translator instructions**, ensuring a perfect result.

## Architecture

```
~/.subagents/                     # Global SubAgents Storage
├── manifest.json                 # Registry of deployed agents
└── {agent}/                      # Agent Directory (Instructions & State)

~/.gemini/                        # Antigravity Configuration
├── GEMINI.md                     # Auto-Routing Instructions
└── antigravity/global_workflows/ # Global Slash Commands
    └── subagent-{name}.md

<ProjectRoot>/                    # Project Configuration
├── .subagents/                   # Project SubAgents
└── .agent/workflows/             # Project Slash Commands
    └── subagent-{name}.md
```

## Documentation

## License

MIT
