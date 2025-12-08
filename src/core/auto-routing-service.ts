import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Marker to detect if auto-routing section already exists
 */
const ROUTING_MARKER_START = "<!-- SUBAGENT-ROUTING -->";
const ROUTING_MARKER_END = "<!-- /SUBAGENT-ROUTING -->";

/**
 * Auto-routing section for Codex CLI (AGENTS.md)
 */
const CODEX_ROUTING_SECTION = `
${ROUTING_MARKER_START}
## SubAgent Auto-Routing

Before starting any task, check \`.subagents/manifest.json\` (project) or \`~/.subagents/manifest.json\` (global).

If the user's request matches any SubAgent by name or description:
1. Read the SubAgent instructions from \`instructionsPath\` in manifest
2. Execute using \`commands.start\` from manifest
3. Handle questions via \`commands.resume\`
4. Report results to user

**Do NOT ask for confirmation** — delegate and report.

Available commands:
- \`/subagent-auto\` — auto-select best SubAgent
- \`/subagent-{name}\` — call specific SubAgent
${ROUTING_MARKER_END}
`;

/**
 * Auto-routing section for Claude Code CLI (CLAUDE.md)
 */
const CLAUDE_ROUTING_SECTION = `
${ROUTING_MARKER_START}
## SubAgent Auto-Routing

Before starting any task, check \`.subagents/manifest.json\` (project) or \`~/.subagents/manifest.json\` (global).

If the user's request matches any SubAgent by name or description:
1. Read the SubAgent instructions from \`instructionsPath\` in manifest
2. Execute using \`commands.start\` from manifest
3. Handle questions via \`commands.resume\`
4. Report results to user

**Do NOT ask for confirmation** — delegate and report.

Available commands:
- \`/subagent-auto\` — auto-select best SubAgent
- \`/subagent-{name}\` — call specific SubAgent
${ROUTING_MARKER_END}
`;

/**
 * Service for managing auto-routing instructions in CLI config files
 */
export class AutoRoutingService {
  /**
   * Ensure auto-routing section exists in global CLI config files
   * Called on first deploy
   */
  async ensureAutoRoutingInstructions(): Promise<void> {
    const homeDir = homedir();

    await Promise.all([
      this._ensureRoutingInFile(
        join(homeDir, ".codex", "AGENTS.md"),
        CODEX_ROUTING_SECTION
      ),
      this._ensureRoutingInFile(
        join(homeDir, ".claude", "CLAUDE.md"),
        CLAUDE_ROUTING_SECTION
      ),
    ]);
  }

  /**
   * Check if routing section exists and add if missing
   */
  private async _ensureRoutingInFile(
    filePath: string,
    routingSection: string
  ): Promise<void> {
    let content = "";

    try {
      content = await readFile(filePath, "utf-8");
    } catch (_ignored) {
      // File doesn't exist, will create with routing section
    }

    // Check if already has routing section
    if (content.includes(ROUTING_MARKER_START)) {
      return; // Already has routing, skip
    }

    // Append routing section
    const newContent = content + routingSection;
    await writeFile(filePath, newContent, "utf-8");
  }

  /**
   * Remove auto-routing section from global CLI config files
   * Called when last SubAgent is undeployed
   */
  async removeAutoRoutingInstructions(): Promise<void> {
    const homeDir = homedir();

    await Promise.all([
      this._removeRoutingFromFile(join(homeDir, ".codex", "AGENTS.md")),
      this._removeRoutingFromFile(join(homeDir, ".claude", "CLAUDE.md")),
    ]);
  }

  /**
   * Remove routing section from file
   */
  private async _removeRoutingFromFile(filePath: string): Promise<void> {
    let content = "";

    try {
      content = await readFile(filePath, "utf-8");
    } catch (_ignored) {
      return; // File doesn't exist, nothing to remove
    }

    // Check if has routing section
    if (!content.includes(ROUTING_MARKER_START)) {
      return; // No routing section, nothing to remove
    }

    // Remove the routing section (including markers)
    const startIdx = content.indexOf(ROUTING_MARKER_START);
    const endIdx = content.indexOf(ROUTING_MARKER_END);

    if (startIdx === -1 || endIdx === -1) {
      return; // Malformed markers
    }

    // Remove from start marker to end marker (inclusive) plus trailing newline
    const beforeSection = content.substring(0, startIdx);
    const afterSection = content.substring(
      endIdx + ROUTING_MARKER_END.length + 1
    );

    const newContent = beforeSection + afterSection;
    await writeFile(filePath, `${newContent.trim()}\n`, "utf-8");
  }
}
