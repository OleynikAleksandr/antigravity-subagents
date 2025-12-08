# Changelog

All notable changes to **Antigravity SubAgents** are documented here.

## [0.0.2] - 2025-12-08

### Fixed
- **Sandbox Permissions**: Sub-Agents now run with `danger-full-access` to allow file creation in the project root.
- **Manifest**: Updated default `translator` agent configuration.

## [0.0.1] - 2025-12-08

### Added
- **First Release** of Antigravity SubAgents!
- **Orchestrator Support**: Turns Antigravity (Gemini CLI) into a powerful Orchestrator.
- **Auto-Routing**: Automatically injects routing instructions into `~/.gemini/GEMINI.md`.
- **Workflow Generation**: Creates Slash Commands for Antigravity in `.agent/workflows/` (Project) and `~/.gemini/antigravity/global_workflows/` (Global).
- **Sub-Agent Support**: Create and manage Sub-Agents executed by **Codex CLI** or **Claude Code CLI**.
- **UI**: VS Code Webview for visual agent management (Create, Edit, Deploy, Library).
