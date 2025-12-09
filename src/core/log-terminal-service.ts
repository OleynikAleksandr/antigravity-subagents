import { homedir } from "node:os";
import { join } from "node:path";
// biome-ignore lint/performance/noNamespaceImport: VS Code API requires namespace import
import * as vscode from "vscode";

const TERMINAL_NAME = "SubAgent Log";

/**
 * Opens or focuses a terminal showing SubAgent log
 * Uses tail -f to follow the log file in real-time
 */
export function openLogTerminal(subagentsDir?: string): vscode.Terminal {
  // Check if terminal already exists
  const existing = vscode.window.terminals.find(
    (t) => t.name === TERMINAL_NAME
  );

  if (existing) {
    existing.show();
    return existing;
  }

  // Determine log file path
  const logDir = subagentsDir || join(homedir(), ".subagents");
  const logFile = join(logDir, "subagent.log");

  // Create new terminal
  const terminal = vscode.window.createTerminal({
    name: TERMINAL_NAME,
    message: "📋 SubAgent Log - Watching for activity...",
  });

  // Start tail with history (last 200 lines) + follow
  terminal.sendText(`tail -n 200 -f "${logFile}"`);
  terminal.show();

  return terminal;
}

/**
 * Ensures the log terminal is open and visible
 * Called automatically on first SubAgent deploy
 */
export function ensureLogTerminalOpen(subagentsDir: string): void {
  openLogTerminal(subagentsDir);
}
