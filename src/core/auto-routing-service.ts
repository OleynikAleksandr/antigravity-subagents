import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Marker to detect if auto-routing section already exists
 */
const ROUTING_MARKER_START = "<!-- SUBAGENT-ROUTING -->";
const ROUTING_MARKER_END = "<!-- /SUBAGENT-ROUTING -->";

/**
 * Auto-routing section for Antigravity (GEMINI.md)
 */
const GEMINI_ROUTING_SECTION = `
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

    // Target only ~/.gemini/GEMINI.md
    await this._ensureRoutingInFile(
      join(homeDir, ".gemini", "GEMINI.md"),
      GEMINI_ROUTING_SECTION
    );
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
      // But first ensure directory exists
      try {
        await mkdir(dirname(filePath), { recursive: true });
      } catch (err) {
        console.error(`Failed to create directory for ${filePath}`, err);
      }
    }

    // Check if already has routing section
    if (content.includes(ROUTING_MARKER_START)) {
      return; // Already has routing, skip
    }

    // Append routing section
    // Ensure there is a newline before appending if file is not empty
    const prefix = content && !content.endsWith("\n") ? "\n" : "";
    const newContent = content + prefix + routingSection;
    await writeFile(filePath, newContent, "utf-8");
  }

  /**
   * Remove auto-routing section from global CLI config files
   * Called when last SubAgent is undeployed
   */
  async removeAutoRoutingInstructions(): Promise<void> {
    const homeDir = homedir();

    // Remove from ~/.gemini/GEMINI.md
    await this._removeRoutingFromFile(join(homeDir, ".gemini", "GEMINI.md"));
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
    // We want to remove the exact block we added
    const beforeSection = content.substring(0, startIdx);
    const afterSection = content.substring(endIdx + ROUTING_MARKER_END.length);

    // Clean up extra newlines if they resulted from removal
    let newContent = beforeSection + afterSection;

    // If we left a trailing newline that wasn't there originally (or just cleanup)
    // For safety, just trim end and ensure one newline if content remains
    newContent = newContent.trim();
    if (newContent.length > 0) {
      newContent += "\n";
    }

    await writeFile(filePath, newContent, "utf-8");
  }
}
