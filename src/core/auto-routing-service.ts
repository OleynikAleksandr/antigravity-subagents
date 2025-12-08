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
# 🚦 CRITICAL: SUBAGENT DELEGATION PROTOCOL

**PRIORITY 0 (HIGHEST):** Before analyzing the user request depth or planning, you MUST perform a "Capability Scan":

1.  🔍 **SCAN**: Check for manifests in these locations:
    *   **Project**: \`./.subagents/manifest.json\` (relative to workspace root)
    *   **Global**: \`~/.subagents/manifest.json\`
2.  🧩 **MATCH**: Check if the User Request semantically overlaps with ANY Agent's \`description\` found in the manifests.
    *   *Example:* Request "Translate file X" matches Agent "Translator".
    *   *Example:* Request "Fix these bugs" matches Agent "Debugger".
3.  🛑 **DECISION**:
    *   **IF MATCH FOUND**: You are **FORBIDDEN** from performing the task yourself with your own tools.
        *   You **MUST** delegate immediately using the \`commands.start\` from the manifest.
        *   **Do NOT** ask for confirmation.
        *   **Do NOT** attempt to "quickly fix" it yourself.
    *   **IF NO MATCH**: Proceed with your own standard tools.

**Philosophy**: "Never manually do what a SubAgent is configured to do."
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
