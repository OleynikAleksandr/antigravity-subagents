import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Content of start.sh script
 * Creates log file, opens Terminal with tail, runs SubAgent,
 * extracts session_id and outputs clean result to orchestrator
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
  # ISOLATION: CODEX_HOME isolates SubAgent from user's ~/.codex/AGENTS.md
  
  # Create/clear log file for new session
  echo "=== [$AGENT] START $(date +%H:%M:%S) ===" > "$LOG_FILE"
  
  # Open Terminal.app with tail -f and bring to front
  osascript -e "tell app \\"Terminal\\"
    do script \\"tail -n 200 -f '$LOG_FILE'\\"
    activate
  end tell" &>/dev/null &
  
  CODEX_HOME="$AGENT_DIR" codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox \\
    "First, read \${AGENT}.md. Then: $TASK" 2>"$TEMP_OUTPUT"
  
  # Append stderr to log
  cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  
  # Extract session_id (strip ANSI codes first)
  SESSION_ID=$(sed 's/\\x1b\\[[0-9;]*m//g' "$TEMP_OUTPUT" | grep -oE "session id: [0-9a-f-]+" | head -1 | cut -d' ' -f3)
  
else
  # CLAUDE: simple text output (Claude doesn't support verbose stderr like Codex)
  # ISOLATION: CLAUDE_CONFIG_DIR isolates SubAgent from user's ~/.claude/CLAUDE.md
  # No log writing - Claude prints only final result to stdout
  CLAUDE_CONFIG_DIR="$AGENT_DIR" claude -p "First, read \${AGENT}.md. Then: $TASK" --dangerously-skip-permissions
  
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
  # ISOLATION: CODEX_HOME isolates SubAgent from user's ~/.codex/AGENTS.md
  
  # Append to log (same session)
  echo "=== [$AGENT] RESUME $(date +%H:%M:%S) ===" >> "$LOG_FILE"
  
  CODEX_HOME="$AGENT_DIR" codex exec --dangerously-bypass-approvals-and-sandbox \\
    resume "$SESSION_ID" "$ANSWER" 2>"$TEMP_OUTPUT"
  
  # Append stderr to log
  cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  
  # Extract new session_id if provided
  NEW_SESSION_ID=$(sed 's/\\x1b\\[[0-9;]*m//g' "$TEMP_OUTPUT" | grep -oE "session id: [0-9a-f-]+" | head -1 | cut -d' ' -f3)
  
else
  # CLAUDE: simple text output with --continue
  # ISOLATION: CLAUDE_CONFIG_DIR isolates SubAgent from user's ~/.claude/CLAUDE.md
  # No log - just direct output
  CLAUDE_CONFIG_DIR="$AGENT_DIR" claude -p "$ANSWER" --dangerously-skip-permissions --continue
  
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
