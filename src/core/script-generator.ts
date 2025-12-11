import { chmod, mkdir, stat, symlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { FORMAT_LOG_SCRIPT } from "./format-log-content";

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
  # CLAUDE: Real-time formatted JSONL log viewer
  # ISOLATION: --setting-sources "" blocks all CLAUDE.md files
  # Credentials from macOS Keychain remain accessible
  
  # Create sessions directory and log file with known name
  SESSIONS_DIR="$AGENT_DIR/sessions"
  mkdir -p "$SESSIONS_DIR"
  LOG_FILE="$SESSIONS_DIR/$(date +%Y%m%d_%H%M%S).jsonl"
  FORMATTER="$SUBAGENTS_DIR/format-log.js"
  
  # Create empty log file so tail -f starts immediately
  touch "$LOG_FILE"
  
  # Open Terminal.app with tail -f on the known log file
  osascript -e "tell app \\"Terminal\\"
    do script \\"tail -n 200 -f '$LOG_FILE' | node '$FORMATTER'\\"
    activate
  end tell" &>/dev/null &
  
  # Small delay to ensure Terminal opens before output starts
  sleep 0.5
  
  # Run Claude with stream-json output, pipe to log file, and parse result for orchestrator
  RESULT=$(claude -p "First, read \${AGENT}.md. Then: $TASK" \\
    --dangerously-skip-permissions \\
    --setting-sources "" \\
    --output-format stream-json \\
    --verbose 2>&1 | tee "$LOG_FILE" | grep '"type":"result"' | tail -1)
  
  # Extract the actual result text for orchestrator
  if [ -n "$RESULT" ]; then
    echo "$RESULT" | node -e "
      const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
      if (data.result) console.log(data.result);
    " 2>/dev/null || echo "Task completed. Check log for details."
  else
    echo "Task completed."
  fi
  
  # Extract session_id from stream-json output
  SESSION_ID=$(grep '"session_id"' "$LOG_FILE" | head -1 | sed 's/.*"session_id":"\\([^"]*\\)".*/\\1/')
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
  # CLAUDE: Resume session - append to existing log file
  # ISOLATION: --setting-sources "" blocks all CLAUDE.md files
  # NOTE: Terminal is already open from start.sh, watching the log file
  
  # Find the latest session log file (same one that Terminal is watching)
  SESSIONS_DIR="$AGENT_DIR/sessions"
  LOG_FILE=$(ls -t "$SESSIONS_DIR"/*.jsonl 2>/dev/null | head -1)
  
  # If no log file exists (shouldn't happen in resume), create new one
  if [ -z "$LOG_FILE" ]; then
    mkdir -p "$SESSIONS_DIR"
    LOG_FILE="$SESSIONS_DIR/$(date +%Y%m%d_%H%M%S).jsonl"
    touch "$LOG_FILE"
  fi
  
  # Run Claude with stream-json output, APPEND to existing log file
  # Terminal that's already watching this file will see new output
  RESULT=$(claude -p "$ANSWER" \\
    --dangerously-skip-permissions \\
    --continue \\
    --setting-sources "" \\
    --output-format stream-json \\
    --verbose 2>&1 | tee -a "$LOG_FILE" | grep '"type":"result"' | tail -1)
  
  # Extract the actual result text for orchestrator
  if [ -n "$RESULT" ]; then
    echo "$RESULT" | node -e "
      const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
      if (data.result) console.log(data.result);
    " 2>/dev/null || echo "Task completed. Check log for details."
  else
    echo "Task completed."
  fi
  
  # Extract session_id from stream-json output
  NEW_SESSION_ID=$(grep '"session_id"' "$LOG_FILE" | tail -1 | sed 's/.*"session_id":"\\([^"]*\\)".*/\\1/')
fi

rm -f "$TEMP_OUTPUT"

# Output session_id marker for orchestrator
if [ -n "$NEW_SESSION_ID" ] && [ "$NEW_SESSION_ID" != "null" ]; then
  echo ""
  echo "[SESSION_ID: $NEW_SESSION_ID]"
fi
`;

/**
 * Ensure start.sh, resume.sh and format-log.js scripts exist in subagents directory
 */
export async function ensureScripts(subagentsDir: string): Promise<void> {
  await mkdir(subagentsDir, { recursive: true });

  const startPath = join(subagentsDir, "start.sh");
  const resumePath = join(subagentsDir, "resume.sh");
  const formatterPath = join(subagentsDir, "format-log.js");

  await writeFile(startPath, START_SCRIPT, "utf-8");
  await writeFile(resumePath, RESUME_SCRIPT, "utf-8");
  await writeFile(formatterPath, FORMAT_LOG_SCRIPT, "utf-8");

  // Make scripts executable
  await chmod(startPath, 0o755);
  await chmod(resumePath, 0o755);
  await chmod(formatterPath, 0o755);
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
