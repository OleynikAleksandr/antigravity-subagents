# Changelog

All notable changes to **SubAgent Manager** are documented here.

## [0.0.20] - 2025-12-07

### Changed
- **Renamed** project from `multicli-agents` to `antigravity-subagents`

### Fixed  
- Race condition when deploying multiple SubAgents simultaneously (batch deploy)
- Activity Bar SVG icon now uses `currentColor` for theme compatibility
- Extensions Page PNG icon with dark background

## [0.0.13] - 2025-12-07

### Fixed
- Batch deploy to prevent manifest.json race condition
- New MsA logo icons (PNG + SVG)

## [0.0.12] - 2025-12-07

### Added
- "Select All" checkbox on Deployed SubAgents screen
- Edit button disabled when multiple agents selected

## [0.0.11] - 2025-12-07

### Added
- Full cleanup on SubAgent undeploy:
  - Removes agent directory and manifest entry
  - Removes individual slash commands (`subagent-{name}.md`)
  - Removes `subagent-auto.md` when last agent undeployed
  - Removes auto-routing instructions from `AGENTS.md` and `CLAUDE.md`

## [0.0.10] - 2025-12-06

### Added
- Auto-routing instructions in `~/.codex/AGENTS.md` and `~/.claude/CLAUDE.md`
- Individual slash commands per SubAgent (`subagent-{name}.md`)
- Shared `AgentCard` component to reduce duplication

### Changed
- Refactored `WebviewProvider` into `MessageHandlers` class
- Extracted `SaveToLibraryModal` component

## [0.0.9] - 2025-12-06

### Added
- **Deployed SubAgents** screen with Project/Global sections
- **Save to Library** action with duplicate detection
- Home Screen with 3 navigation buttons

### Changed
- Replaced "Browse" with "Library" and "Deployed" screens

## [0.0.8] - 2025-12-06

### Added
- Toolbar with batch actions (Edit, Deploy, Export, Delete)
- "Select All" checkbox in Library
- Deploy confirmation modal with target selection

### Changed
- Refactored `agent-list.tsx` with modular components

## [0.0.7] - 2025-12-06

### Added
- Global deploy to `~/.subagents/` and `~/.codex/prompts/`
- Full instruction path in manifest.json

### Fixed
- Codex slash commands deploy only to global location

## [0.0.6] - 2025-12-06

### Fixed
- Removed emojis from UI buttons
- Fixed terminology consistency ("SubAgent")

## [0.0.5] - 2025-12-06

### Added
- Dark theme UI
- Home, Create, Browse screens
- Deploy service with slash command generation

## [0.0.1] - 2025-12-05

### Added
- Initial MVP release
- VS Code Extension with Webview UI
- SubAgent model and Library service
- Export/Import functionality
