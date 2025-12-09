import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Content of start.sh script
 * Creates log file, opens Terminal with tail, runs SubAgent,
 * extracts session_id from stderr and appends it to stdout
 */
const START_SCRIPT = `#!/bin/bash
VENDOR="$1"
AGENT="$2"
TASK="$3"

SUBAGENTS_DIR="$(dirname "$0")"
AGENT_DIR="$SUBAGENTS_DIR/$AGENT"
LOG_FILE="$SUBAGENTS_DIR/subagent.log"
TEMP_STDERR=$(mktemp)

# Create/clear log file for new session
echo "=== [$AGENT] START $(date +%H:%M:%S) ===" > "$LOG_FILE"

# Open Terminal.app with tail -f and bring to front
osascript -e "tell app \\"Terminal\\"
  do script \\"tail -n 200 -f '$LOG_FILE'\\"
  activate
end tell" &>/dev/null &

cd "$AGENT_DIR"

# Run SubAgent, capture stderr separately
if [ "$VENDOR" = "codex" ]; then
  codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox \\
    "First, read \${AGENT}.md. Then: $TASK" 2>"$TEMP_STDERR"
else
  claude -p "First, read \${AGENT}.md. Then: $TASK" \\
    --dangerously-skip-permissions 2>"$TEMP_STDERR"
fi

# Extract session_id from stderr (Codex format: "session id: UUID")
SESSION_ID=$(grep -oE "session id: [0-9a-f-]+" "$TEMP_STDERR" | head -1 | cut -d' ' -f3)

# Append stderr to log file
cat "$TEMP_STDERR" >> "$LOG_FILE"
rm -f "$TEMP_STDERR"

# Output session_id marker for orchestrator to parse
if [ -n "$SESSION_ID" ]; then
  echo ""
  echo "[SESSION_ID: $SESSION_ID]"
fi
`;

/**
 * Content of resume.sh script
 * Appends to log file (same session continues)
 */
const RESUME_SCRIPT = `#!/bin/bash
VENDOR="$1"
AGENT="$2"
SESSION_ID="$3"
ANSWER="$4"

SUBAGENTS_DIR="$(dirname "$0")"
AGENT_DIR="$SUBAGENTS_DIR/$AGENT"
LOG_FILE="$SUBAGENTS_DIR/subagent.log"

# Append to log (same session)
echo "=== [$AGENT] RESUME $(date +%H:%M:%S) ===" >> "$LOG_FILE"

cd "$AGENT_DIR"

if [ "$VENDOR" = "codex" ]; then
  codex exec --dangerously-bypass-approvals-and-sandbox \\
    resume "$SESSION_ID" "$ANSWER" 2>>"$LOG_FILE"
else
  claude --continue "$ANSWER" --dangerously-skip-permissions 2>>"$LOG_FILE"
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
