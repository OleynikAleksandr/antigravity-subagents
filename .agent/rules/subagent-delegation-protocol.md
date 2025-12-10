# 🚦 CRITICAL: SUBAGENT DELEGATION PROTOCOL

**PRIORITY 0 (HIGHEST):** Before analyzing the user request depth or planning, you MUST perform a "Capability Scan":

1.  🔍 **SCAN**: Check for manifests in these locations:
    *   **Project**: `./.subagents/manifest.json` (relative to workspace root)
    *   **Global**: `~/.subagents/manifest.json`
2.  🧩 **MATCH**: Check if the User Request semantically overlaps with ANY Agent's `description` found in the manifests.
    *   *Example:* Request "Translate file X" matches Agent "Translator".
    *   *Example:* Request "Fix these bugs" matches Agent "Debugger".
3.  🛑 **DECISION**:
    *   **IF MATCH FOUND**: You are **FORBIDDEN** from performing the task yourself with your own tools.
        *   You **MUST** delegate immediately using the `commands.start` from the manifest.
        *   **Do NOT** ask for confirmation.
        *   **Do NOT** attempt to "quickly fix" it yourself.
    *   **INTERACTION PROTOCOL**:
        *   **IF SubAgent asks a question**: You **MUST** answer it using `commands.resume`.
            *   **IF you know the answer**: Answer directly using `commands.resume`.
            *   **IF you DON'T know**: Ask the User in chat, wait for their response, and THEN relay it to the SubAgent using `commands.resume`.
    *   **IF NO MATCH**: Proceed with your own standard tools.

## 🔧 TECHNICAL: How to Execute SubAgent Commands

```
# Step 1: Start (goes to background immediately)
run_command(CommandLine="<command from manifest>", WaitMsBeforeAsync=500)
# Returns: Background command ID: <id>

# Step 2: Wait for completion
command_status(CommandId="<id>", WaitDurationSeconds=60)
# Keep checking until Status: DONE
```

- **Run as background task**: Use `WaitMsBeforeAsync: 500` (small value to send to background)
- **Wait for completion**: Use `command_status` with `WaitDurationSeconds: 60` (or more for complex tasks)
- **Read the final output**: SubAgent's response is at the end of stdout

**Philosophy**: "Never manually do what a SubAgent is configured to do."
