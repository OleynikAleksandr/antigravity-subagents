import { chmod, mkdir, stat, symlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Content of start.sh script
 * Creates log file, opens Terminal with tail, runs SubAgent,
 * extracts session_id and outputs clean result to orchestrator
 *
 * ISOLATION STRATEGY:
 * - Codex: CODEX_HOME points to .codex subdir with symlink to ~/.codex/auth.json
 *          This blocks ~/.codex/AGENTS.md while preserving authentication
 * - Claude: --setting-sources "" blocks all CLAUDE.md files
 *          Credentials from macOS Keychain remain accessible
 *
 * Codex: stderr -> log, stdout -> result, session_id from stderr
 * Claude: simple text output only (no verbose logging support in print mode)
 */
const START_SCRIPT = `#!/bin/bash
VENDOR="$1"
AGENT="$2"
TASK="$3"

SUBAGENTS_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="$SUBAGENTS_DIR/$AGENT"
LOG_FILE="$SUBAGENTS_DIR/subagent.log"
TEMP_OUTPUT=$(mktemp)

cd "$AGENT_DIR"

if [ "$VENDOR" = "codex" ]; then
  # CODEX: stderr contains session_id and verbose logs
  # ISOLATION: CODEX_HOME points to .codex subdir with symlinked auth.json
  # This blocks ~/.codex/AGENTS.md while preserving authentication
  
  # Create/clear log file for new session
  echo "=== [$AGENT] START $(date +%H:%M:%S) ===" > "$LOG_FILE"
  
  # Open Terminal.app with tail -f and bring to front
  osascript -e "tell app \\"Terminal\\"
    do script \\"tail -n 200 -f '$LOG_FILE'\\"
    activate
  end tell" &>/dev/null &
  
  # Run Codex with stderr streaming to both log file (real-time) and temp file (for session_id extraction)
  CODEX_HOME="$AGENT_DIR/.codex" codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox \\
    "First, read \${AGENT}.md. Then: $TASK" 2> >(tee "$TEMP_OUTPUT" >> "$LOG_FILE")
  
  # Extract session_id (strip ANSI codes first)
  SESSION_ID=$(sed 's/\\x1b\\[[0-9;]*m//g' "$TEMP_OUTPUT" | grep -oE "session id: [0-9a-f-]+" | head -1 | cut -d' ' -f3)
  
else
  # CLAUDE: simple text output (Claude doesn't support verbose stderr like Codex)
  # ISOLATION: --setting-sources "" blocks all CLAUDE.md files
  # Credentials from macOS Keychain remain accessible
  # No log writing - Claude prints only final result to stdout
  claude -p "First, read \${AGENT}.md. Then: $TASK" --dangerously-skip-permissions --setting-sources ""
  
  # Claude doesn't output session_id in text mode
  SESSION_ID=""
fi

rm -f "$TEMP_OUTPUT"

# Output session_id marker for orchestrator to parse
if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
  echo ""
  echo "[SESSION_ID: $SESSION_ID]"
fi
`;

/**
 * Content of resume.sh script
 * Appends to log file (same session continues)
 *
 * ISOLATION: Same strategy as start.sh
 *
 * Codex: uses resume command with session_id
 * Claude: uses --continue (no session_id support in simple mode)
 */
const RESUME_SCRIPT = `#!/bin/bash
VENDOR="$1"
AGENT="$2"
SESSION_ID="$3"
ANSWER="$4"

SUBAGENTS_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="$SUBAGENTS_DIR/$AGENT"
LOG_FILE="$SUBAGENTS_DIR/subagent.log"
TEMP_OUTPUT=$(mktemp)

cd "$AGENT_DIR"

if [ "$VENDOR" = "codex" ]; then
  # CODEX: use resume command with session_id
  # ISOLATION: CODEX_HOME points to .codex subdir with symlinked auth.json
  
  # Append to log (same session)
  echo "=== [$AGENT] RESUME $(date +%H:%M:%S) ===" >> "$LOG_FILE"
  
  CODEX_HOME="$AGENT_DIR/.codex" codex exec --dangerously-bypass-approvals-and-sandbox \\\\
    resume "$SESSION_ID" "$ANSWER" 2>"$TEMP_OUTPUT"
  
  # Append stderr to log
  cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  
  # Extract new session_id if provided
  NEW_SESSION_ID=$(sed 's/\\\\x1b\\\\[[0-9;]*m//g' "$TEMP_OUTPUT" | grep -oE "session id: [0-9a-f-]+" | head -1 | cut -d' ' -f3)
  
else
  # CLAUDE: simple text output with --continue
  # ISOLATION: --setting-sources "" blocks all CLAUDE.md files
  # No log - just direct output
  claude -p "$ANSWER" --dangerously-skip-permissions --continue --setting-sources ""
  
  # Claude doesn't output session_id in text mode
  NEW_SESSION_ID=""
fi

rm -f "$TEMP_OUTPUT"

# Output session_id marker for orchestrator
if [ -n "$NEW_SESSION_ID" ] && [ "$NEW_SESSION_ID" != "null" ]; then
  echo ""
  echo "[SESSION_ID: $NEW_SESSION_ID]"
fi
`;

/**
 * Ensure start.sh and resume.sh scripts exist in subagents directory
 */
export async function ensureScripts(subagentsDir: string): Promise<void> {
  await mkdir(subagentsDir, { recursive: true });

  const startPath = join(subagentsDir, "start.sh");
  const resumePath = join(subagentsDir, "resume.sh");

  await writeFile(startPath, START_SCRIPT, "utf-8");
  await writeFile(resumePath, RESUME_SCRIPT, "utf-8");

  // Make scripts executable
  await chmod(startPath, 0o755);
  await chmod(resumePath, 0o755);
}

/**
 * Setup Codex isolation for a SubAgent directory
 * Creates .codex subdirectory with symlink to ~/.codex/auth.json
 *
 * This allows:
 * - Isolation from user's ~/.codex/AGENTS.md
 * - Preserved authentication (symlinked auth.json)
 */
export async function setupCodexIsolation(agentDir: string): Promise<void> {
  const codexDir = join(agentDir, ".codex");
  const authSymlink = join(codexDir, "auth.json");
  const userAuthFile = join(homedir(), ".codex", "auth.json");

  // Create .codex directory
  await mkdir(codexDir, { recursive: true });

  // Create symlink to user's auth.json if it exists and symlink doesn't exist
  try {
    await stat(authSymlink);
    // Symlink already exists, skip
  } catch {
    // Symlink doesn't exist, try to create it
    try {
      await stat(userAuthFile);
      await symlink(userAuthFile, authSymlink);
    } catch {
      // User auth.json doesn't exist (they might use API key instead)
      // This is fine, Codex will prompt for login if needed
    }
  }
}
