# Antigravity SubAgents

**VS Code Extension to empower Antigravity (Gemini CLI) as an Orchestrator for Sub-Agents (Codex CLI, Claude Code CLI).**

![Version](https://img.shields.io/badge/version-0.0.2-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

**Antigravity SubAgents** turns your local Antigravity (Gemini CLI) into a powerful **Orchestrator**. It allows you to create, organize, and manage specialized Sub-Agents that are executed by other CLI tools (**Codex CLI** or **Claude Code CLI**), but controlled centrally by Antigravity.

### Key Features

- **Orchestration** — Antigravity (Gemini CLI) acts as the Main Agent, delegating tasks to specialized Sub-Agents.
- **Sub-Agent Vendors** — Create agents that run on **Codex CLI** or **Claude Code CLI**.
- **Auto-Routing** — Automatically injects routing instructions into `~/.gemini/GEMINI.md`, enabling Antigravity to intelligently select the right agent for the job.
- **Workflow Generation** — Automatically generates Slash Commands for Antigravity:
  - **Global**: `~/.gemini/antigravity/global_workflows/`
  - **Project**: `<project>/.agent/workflows/`
- **Visual Editor** — Rich VS Code UI to create and manage agents.
- **Sandbox Control** — Sub-Agents run with `danger-full-access` permissions, allowing them to effectively work on your project files when commanded.

![Create SubAgent UI](docs/images/create-subagent-ui.png)

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
4. **Use** in Antigravity (Gemini CLI):
   - **Auto**: Just ask "Translate this file..." -> Antigravity will route it to your Sub-Agent.
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
1. You ask Antigravity: "Translate README.md to Russian".
2. Antigravity reads `GEMINI.md` and finds the `translator` agent.
3. Antigravity executes the Sub-Agent via `codex exec`.
4. The Sub-Agent performs the work.

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

- [Changelog](CHANGELOG.md)

## License

MIT
