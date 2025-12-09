import { useState } from "react";
import { vscode } from "../api/vscode";
import type { SubAgent, SubAgentVendor } from "../models/types";

type AgentEditorProps = {
  initialAgent?: SubAgent | null;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Generate CLI commands preview based on agent name and vendor
 * Note: $SUBAGENTS_DIR is a placeholder that gets replaced with actual path during deploy
 */
const generateCommands = (
  name: string,
  vendor: SubAgentVendor
): { start: string; resume: string } => {
  // Use placeholder - will be replaced with real path during deploy
  const subagentsDir = "$SUBAGENTS_DIR";

  return {
    start: `"${subagentsDir}/start.sh" ${vendor} ${name} "$TASK"`,
    resume: `"${subagentsDir}/resume.sh" ${vendor} ${name} $SESSION_ID "$ANSWER"`,
  };
};

/**
 * Agent Editor - Form for creating/editing agents
 */
export const AgentEditor = ({
  initialAgent,
  onSave,
  onCancel,
}: AgentEditorProps) => {
  const [name, setName] = useState(initialAgent?.name || "");
  const [description, setDescription] = useState(
    initialAgent?.description || ""
  );
  const [vendor, setVendor] = useState<SubAgentVendor>(
    initialAgent?.vendor || "codex"
  );
  const [instructions, setInstructions] = useState(
    initialAgent?.instructions || ""
  );

  const commands = generateCommands(name, vendor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const agentPayload: SubAgent = {
      id: initialAgent?.id || crypto.randomUUID(),
      name,
      description,
      vendor,
      instructions,
      commands,
      metadata: initialAgent?.metadata || {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    vscode.postMessage({
      command: initialAgent ? "agent.update" : "agent.create",
      payload: agentPayload,
    });

    onSave();
  };

  return (
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
      {/* Name */}
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. translator"
          required
          type="text"
          value={name}
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description">Description (include keywords)</label>
        <input
          id="description"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Translates text. Use for: translate, переведи"
          type="text"
          value={description}
        />
        <div className="form-hint">
          Include keywords for auto-routing in the description
        </div>
      </div>

      {/* Vendor */}
      <div className="form-group">
        <span className="mb-1 block font-medium text-sm">Sub Agent Vendor</span>
        <div className="radio-group">
          {(["codex", "claude"] as SubAgentVendor[]).map((v) => (
            <label key={v}>
              <input
                checked={vendor === v}
                name="vendor"
                onChange={() => setVendor(v)}
                type="radio"
              />
              {v === "codex" ? "Codex CLI" : "Claude Code CLI"}
            </label>
          ))}
        </div>
        <div className="form-hint">CLI that will execute this Sub Agent</div>
      </div>

      {/* Instructions */}
      <div className="form-group">
        <label htmlFor="instructions">Instructions (Markdown)</label>
        <textarea
          id="instructions"
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="# Agent Name&#10;&#10;You are a helpful assistant that..."
          rows={8}
          value={instructions}
        />
      </div>

      {/* Generated Commands (read-only) */}
      {!!name && (
        <div className="form-group">
          <span className="mb-1 block font-medium text-sm">
            Generated Commands
          </span>
          <div className="code-block">
            <div>
              <span className="label">start:</span> {commands.start}
            </div>
            <div className="mt-md">
              <span className="label">resume:</span> {commands.resume}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-md flex justify-between gap-sm">
        <button className="btn-secondary" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary" disabled={!name} type="submit">
          {initialAgent ? "Save Changes" : "Create SubAgent"}
        </button>
      </div>
    </form>
  );
};
