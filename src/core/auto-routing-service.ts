import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
// biome-ignore lint/performance/noNamespaceImport: VS Code API requires namespace import
import * as vscode from "vscode";

/**
 * Filename for the routing protocol rule
 * Must be lowercase with hyphens to be recognized by Gemini IDE
 */
const ROUTING_RULE_FILENAME = "subagent-delegation-protocol.md";

/**
 * Content for the SUBAGENT_DELEGATION_PROTOCOL.md rule file
 */
const ROUTING_RULE_CONTENT = `# 🚦 CRITICAL: SUBAGENT DELEGATION PROTOCOL

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
    *   **INTERACTION PROTOCOL**:
        *   **IF SubAgent asks a question**: You **MUST** answer it using \`commands.resume\`.
            *   **IF you know the answer**: Answer directly using \`commands.resume\`.
            *   **IF you DON'T know**: Ask the User in chat, wait for their response, and THEN relay it to the SubAgent using \`commands.resume\`.
    *   **IF NO MATCH**: Proceed with your own standard tools.

## 🔧 TECHNICAL: How to Execute SubAgent Commands

\`\`\`
# Step 1: Start (goes to background immediately)
run_command(CommandLine="<command from manifest>", WaitMsBeforeAsync=500)
# Returns: Background command ID: <id>

# Step 2: Wait for completion
command_status(CommandId="<id>", WaitDurationSeconds=60)
# Keep checking until Status: DONE
\`\`\`

- **Run as background task**: Use \`WaitMsBeforeAsync: 500\` (small value to send to background)
- **Wait for completion**: Use \`command_status\` with \`WaitDurationSeconds: 60\` (or more for complex tasks)
- **Read the final output**: SubAgent's response is at the end of stdout

**Philosophy**: "Never manually do what a SubAgent is configured to do."
`;

/**
 * Service for managing auto-routing instructions via .agent/rules/
 * Instead of modifying global GEMINI.md, we create a dedicated rule file
 */
export class AutoRoutingService {
  /**
   * Get workspace root path
   */
  private _getWorkspaceRoot(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders?.[0]?.uri.fsPath ?? null;
  }

  /**
   * Ensure auto-routing rule file exists in .agent/rules/
   * Called on first deploy
   */
  async ensureAutoRoutingInstructions(): Promise<void> {
    const workspaceRoot = this._getWorkspaceRoot();
    if (!workspaceRoot) {
      return; // No workspace open
    }

    const rulesDir = join(workspaceRoot, ".agent", "rules");
    const ruleFile = join(rulesDir, ROUTING_RULE_FILENAME);

    // Create .agent/rules/ directory if it doesn't exist
    await mkdir(rulesDir, { recursive: true });

    // Write the rule file (overwrite to ensure latest content)
    await writeFile(ruleFile, ROUTING_RULE_CONTENT, "utf-8");
  }

  /**
   * Remove auto-routing rule file
   * Called when last SubAgent is undeployed
   */
  async removeAutoRoutingInstructions(): Promise<void> {
    const workspaceRoot = this._getWorkspaceRoot();
    if (!workspaceRoot) {
      return; // No workspace open
    }

    const ruleFile = join(
      workspaceRoot,
      ".agent",
      "rules",
      ROUTING_RULE_FILENAME
    );

    // Remove the rule file
    await rm(ruleFile, { force: true });
  }
}
