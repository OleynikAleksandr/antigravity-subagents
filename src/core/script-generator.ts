import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Content of start.sh script
 * Creates log file, opens Terminal with tail, runs SubAgent,
 * extracts session_id and outputs clean result to orchestrator
 *
 * Codex: stderr -> log, stdout -> result, session_id from stderr
 * Claude: --output-format json -> log, extract result+session_id via jq
 */
const START_SCRIPT = `#!/bin/bash
VENDOR="$1"
AGENT="$2"
TASK="$3"

SUBAGENTS_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="$SUBAGENTS_DIR/$AGENT"
LOG_FILE="$SUBAGENTS_DIR/subagent.log"
TEMP_OUTPUT=$(mktemp)

# Create/clear log file for new session
echo "=== [$AGENT] START $(date +%H:%M:%S) ===" > "$LOG_FILE"

# Open Terminal.app with tail -f and bring to front
osascript -e "tell app \\"Terminal\\"
  do script \\"tail -n 200 -f '$LOG_FILE'\\"
  activate
end tell" &>/dev/null &

cd "$AGENT_DIR"

if [ "$VENDOR" = "codex" ]; then
  # CODEX: stderr contains session_id and verbose logs
  codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox \\
    "First, read \${AGENT}.md. Then: $TASK" 2>"$TEMP_OUTPUT"
  
  # Append stderr to log
  cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  
  # Extract session_id (strip ANSI codes first)
  SESSION_ID=$(sed 's/\\x1b\\[[0-9;]*m//g' "$TEMP_OUTPUT" | grep -oE "session id: [0-9a-f-]+" | head -1 | cut -d' ' -f3)
  
else
  # CLAUDE: use JSON output format to get session_id and full logs
  claude -p "First, read \${AGENT}.md. Then: $TASK" \\
    --dangerously-skip-permissions --output-format json > "$TEMP_OUTPUT" 2>&1
  
  # Write full JSON to log (pretty-printed if possible)
  if command -v jq &>/dev/null; then
    jq '.' "$TEMP_OUTPUT" >> "$LOG_FILE" 2>/dev/null || cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  else
    cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  fi
  
  # Extract session_id from JSON (last result block)
  SESSION_ID=$(jq -r 'if type == "array" then .[] else . end | select(.type == "result") | .session_id' "$TEMP_OUTPUT" 2>/dev/null | tail -1)
  
  # Extract result text and output to stdout
  RESULT=$(jq -r 'if type == "array" then .[] else . end | select(.type == "result") | .result' "$TEMP_OUTPUT" 2>/dev/null | tail -1)
  if [ -n "$RESULT" ] && [ "$RESULT" != "null" ]; then
    echo "$RESULT"
  fi
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
 * Claude: uses --resume with session_id and JSON output
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

# Append to log (same session)
echo "=== [$AGENT] RESUME $(date +%H:%M:%S) ===" >> "$LOG_FILE"

cd "$AGENT_DIR"

if [ "$VENDOR" = "codex" ]; then
  # CODEX: use resume command
  codex exec --dangerously-bypass-approvals-and-sandbox \\
    resume "$SESSION_ID" "$ANSWER" 2>"$TEMP_OUTPUT"
  
  # Append stderr to log
  cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  
  # Extract new session_id if provided
  NEW_SESSION_ID=$(sed 's/\\x1b\\[[0-9;]*m//g' "$TEMP_OUTPUT" | grep -oE "session id: [0-9a-f-]+" | head -1 | cut -d' ' -f3)
  
else
  # CLAUDE: use --resume with session_id and JSON format
  claude -p "$ANSWER" --resume "$SESSION_ID" \\
    --dangerously-skip-permissions --output-format json > "$TEMP_OUTPUT" 2>&1
  
  # Write full JSON to log
  if command -v jq &>/dev/null; then
    jq '.' "$TEMP_OUTPUT" >> "$LOG_FILE" 2>/dev/null || cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  else
    cat "$TEMP_OUTPUT" >> "$LOG_FILE"
  fi
  
  # Extract session_id from JSON
  NEW_SESSION_ID=$(jq -r 'if type == "array" then .[] else . end | select(.type == "result") | .session_id' "$TEMP_OUTPUT" 2>/dev/null | tail -1)
  
  # Extract result text and output to stdout
  RESULT=$(jq -r 'if type == "array" then .[] else . end | select(.type == "result") | .result' "$TEMP_OUTPUT" 2>/dev/null | tail -1)
  if [ -n "$RESULT" ] && [ "$RESULT" != "null" ]; then
    echo "$RESULT"
  fi
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
