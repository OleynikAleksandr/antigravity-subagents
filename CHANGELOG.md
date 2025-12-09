# Changelog

All notable changes to **Antigravity SubAgents** are documented here.

## [0.0.11] - 2025-12-09

### Changed
- **Codex CLI Permissions**: SubAgents now use `--dangerously-bypass-approvals-and-sandbox` flag instead of `--sandbox danger-full-access`. This gives Codex SubAgents complete freedom to execute any operations without permission prompts.

## [0.0.10] - 2025-12-08

### Fixed
- **Terminology**: Corrected references from "Antigravity (Gemini CLI)" to "Antigravity IDE" across extension metadata, UI, and code comments for accurate product identification.

## [0.0.9] - 2025-12-08

### Changed
- **User Interaction Protocol**: Improved instructions for Orchestrator when handling SubAgent questions. Now uses direct chat communication instead of `notify_user` tool for better UX.

### Maintenance
- **Cleanup**: Removed test files from repository.
- **Git Ignore**: Added `CHANGELOG_ru.md` to .gitignore to keep localized docs local.

## [0.0.8] - 2025-12-08

### Fixed
- **Codex CLI**: Removed invalid `-a on-request` flag from generated start commands. This fixes the "unexpected argument" error when launching subagents.

### Changed
- **Routing Protocol**: Updated `GEMINI.md` auto-routing instructions with a new **INTERACTION PROTOCOL**.
- **Resume Command**: Explained how to handle SubAgent questions using `commands.resume`.

## [0.0.7] - 2025-12-08

### Changed
- **SubAgent Routing**: Implemented strict "Capability Scan" protocol. Prevents Orchestrator from doing manual work if a suitable SubAgent exists.

## [0.0.6] - 2025-12-08

### Changed
- **Icons**: Updated extension icons (logo).

## [0.0.5] - 2025-12-08

### Documentation
- **Prerequisites**: Added a section detailing the requirement for installed and authenticated **Codex CLI** and **Claude Code CLI**.

## [0.0.4] - 2025-12-08

### Documentation
- **Clarification**: Refined `README` to correctly identify **Antigravity** as an IDE and Main Agents as **Orchestrators**.
- **Features**: Highlighted "Focused Execution" as a key benefit — Sub-Agents run only with narrow instructions.

## [0.0.3] - 2025-12-08

### Documentation
- **README**: Completely rewritten to reflect the new **Antigravity Orchestrator** architecture.
- **Translation**: Updated `README_ru.md` with accurate Russian documentation.

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
