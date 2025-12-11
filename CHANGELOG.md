# Changelog

All notable changes to **Antigravity SubAgents** are documented here.

## [0.0.33] - 2025-12-11

### Fixed
- **Resume (Claude)** — No longer opens new Terminal; appends to existing log file that Terminal is already watching
- Removes unnecessary delays and duplicate Terminal windows

## [0.0.32] - 2025-12-11

## [0.0.31] - 2025-12-11

### Fixed
- **No ESM Warning** — `format-log.js` now uses CommonJS syntax to avoid Node.js module type warnings
- **Increased tool_result Limit** — Tool results now show up to 300 characters (was 150) for better context

## [0.0.30] - 2025-12-11

### Changed
- **Unified Real-time Logging** — Claude SubAgents now use the same approach as Codex:
  - Writes JSONL to `.subagents/<agent>/sessions/<timestamp>.jsonl`
  - Terminal opens with known file path (no waiting/searching)
  - Uses `--output-format stream-json --verbose` for real-time streaming
  - Parses final `result` from JSONL for orchestrator response

## [0.0.29] - 2025-12-11

### Fixed
- **Real-time Logging (Codex)** — stderr now streams to log file in real-time using `tee` instead of being dumped at the end of execution

### Added
- **SubAgent Isolation** — SubAgents are now completely isolated from user's global configuration files:
  - **Codex**: Uses `CODEX_HOME` pointing to `.codex` subdirectory with symlinked `auth.json`
    - Blocks `~/.codex/AGENTS.md` while preserving authentication
  - **Claude**: Uses `--setting-sources ""` flag
    - Blocks all `CLAUDE.md` files, credentials from macOS Keychain remain accessible
  - Works out of the box — no user configuration required
  - Ensures SubAgents execute only their specific instructions without inheriting Orchestrator's or user's settings

## [0.0.27] - 2025-12-11 (SUPERSEDED)

### Note
This version had incomplete isolation implementation. Use v0.0.27 instead.

## [0.0.25] - 2025-12-10

### Changed
- **Local Rules Instead of Global** — Auto-routing instructions now create `.agent/rules/subagent-delegation-protocol.md` instead of modifying `~/.gemini/GEMINI.md`.
  - File is committed to git (required for Gemini IDE recognition)
  - Includes `trigger: always_on` frontmatter
  - Removed when last SubAgent is undeployed

### Fixed
- **Gemini IDE Recognition** — Rule files now use lowercase with hyphens and proper frontmatter.

## [0.0.23] - 2025-12-09

### Added
- **Real-time Logging (Codex)** — When a Codex SubAgent runs, a Terminal window automatically opens showing full verbose output (thinking, tool calls, exec logs). The Orchestrator receives only the final answer to save tokens.
- **Session ID Extraction (Codex)** — Session ID is now extracted from stderr and appended to stdout as `[SESSION_ID: uuid]` for potential resume functionality.

### Changed
- **Claude Simplified Mode** — Claude SubAgents now run in simple text output mode without logging (Claude CLI doesn't support verbose stderr in print mode). Resume uses `--continue` flag.
- **Conditional Terminal** — Terminal window with log viewer opens only for Codex, not for Claude.

### Documentation
- Added `doc/Knowledge/Claude_CLI_Logging_Research.md` — detailed research on Claude CLI logging limitations.

## [0.0.14] - 2025-12-09

### Fixed
- **Clean Orchestrator Output** — Added `2>/dev/null` to all SubAgent commands (both Codex and Claude vendors)
  
  **Problem:** When the Antigravity Orchestrator invoked a SubAgent, it received the entire output stream including:
  - Internal `thinking` blocks (agent reasoning)
  - `exec` command logs with full shell output
  - Intermediate messages and debugging information
  
  This polluted the orchestrator's context window and made it difficult to parse the actual SubAgent response.
  
  **Solution:** All SubAgent commands now redirect stderr to `/dev/null`, ensuring the orchestrator receives **only the final answer** (stdout), not internal processing logs.

- **Command Regeneration on Deploy** — Commands are now regenerated during every deploy operation
  
  Previously, commands stored in the Library were used as-is during deploy. If an agent was created before this fix, its commands would still lack `2>/dev/null`. Now, commands are always regenerated from the centralized `command-generator.ts`, guaranteeing the latest format.

### Added
- `src/core/command-generator.ts` — Centralized command generator for consistent command format across all deploy operations

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
