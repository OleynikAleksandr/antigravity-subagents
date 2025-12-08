import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
// biome-ignore lint/performance/noNamespaceImport: VS Code API
import * as vscode from "vscode";
import type { SubAgent } from "../models/sub-agent";

// Define the file format structure
type SubAgentFile = {
  formatVersion: string;
  exportedAt: string;
  agent: SubAgent;
};

export class ExportImportService {
  async exportAgent(agent: SubAgent): Promise<void> {
    const saveUri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(
        `${agent.name.replace(/\s+/g, "_")}.subagent`
      ),
      filters: {
        "SubAgent Files": ["subagent"],
        "JSON Files": ["json"],
      },
      title: "Export Sub-Agent",
    });

    if (!saveUri) {
      return;
    }

    const fileContent: SubAgentFile = {
      formatVersion: "1.0",
      exportedAt: new Date().toISOString(),
      agent,
    };

    await writeFile(
      saveUri.fsPath,
      JSON.stringify(fileContent, null, 2),
      "utf-8"
    );
    vscode.window.showInformationMessage(
      `Agent "${agent.name}" exported successfully!`
    );
  }

  async importAgent(): Promise<SubAgent | undefined> {
    const fileUris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        "SubAgent Files": ["subagent"],
        "JSON Files": ["json"],
      },
      title: "Import Sub-Agent",
    });

    if (!fileUris || fileUris.length === 0) {
      return;
    }

    const fileUri = fileUris[0];

    try {
      const content = await readFile(fileUri.fsPath, "utf-8");
      const parsed = JSON.parse(content) as unknown;

      // Basic validation
      if (!this._isSubAgentFile(parsed)) {
        throw new Error("Invalid format or missing version/agent data");
      }

      const agent = parsed.agent;

      // Regenerate ID to avoid collisions
      agent.id = randomUUID();

      // Update metadata for imported agent
      agent.metadata.updatedAt = new Date().toISOString();

      return agent;
    } catch (e) {
      vscode.window.showErrorMessage(
        `Failed to import agent: ${e instanceof Error ? e.message : String(e)}`
      );
      return;
    }
  }

  private _isSubAgentFile(data: unknown): data is SubAgentFile {
    return (
      typeof data === "object" &&
      data !== null &&
      "formatVersion" in data &&
      "agent" in data
    );
  }
}
