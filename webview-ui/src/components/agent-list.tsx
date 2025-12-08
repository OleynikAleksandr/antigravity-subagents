import { useEffect, useState } from "react";
import { vscode } from "../api/vscode";
import type { SubAgent } from "../models/types";
import { AgentCard } from "./agent-card";
import { DeleteModal } from "./delete-modal";
import { DeployModal } from "./deploy-modal";

type AgentListProps = {
  onCreate: () => void;
  onEdit: (agent: SubAgent) => void;
};

/**
 * Browse Screen - List of all SubAgents with checkbox selection and toolbar
 */
export const AgentList = ({ onCreate, onEdit }: AgentListProps) => {
  const [agents, setAgents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deployAgents, setDeployAgents] = useState<SubAgent[] | null>(null);
  const [deployTarget, setDeployTarget] = useState<"project" | "global" | null>(
    null
  );
  const [deleteAgents, setDeleteAgents] = useState<SubAgent[] | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "agent.list.result") {
        setAgents(message.payload as SubAgent[]);
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({ command: "agent.list" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === agents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(agents.map((a) => a.id)));
    }
  };

  const getSelectedAgents = (): SubAgent[] =>
    agents.filter((a) => selectedIds.has(a.id));

  const handleDeploy = () => {
    if (!(deployAgents && deployTarget)) {
      return;
    }
    // Use batch deploy to prevent race condition
    vscode.postMessage({
      command:
        deployTarget === "project"
          ? "agent.deploy.batch.project"
          : "agent.deploy.batch.global",
      payload: deployAgents,
    });
    setDeployAgents(null);
    setDeployTarget(null);
    setSelectedIds(new Set());
  };

  const handleExport = () => {
    for (const agent of getSelectedAgents()) {
      vscode.postMessage({ command: "agent.export", payload: agent });
    }
    setSelectedIds(new Set());
  };

  const handleDeleteConfirm = () => {
    if (deleteAgents) {
      for (const agent of deleteAgents) {
        vscode.postMessage({
          command: "agent.delete",
          payload: { id: agent.id },
        });
      }
      const deleteIds = new Set(deleteAgents.map((a) => a.id));
      setAgents(agents.filter((a) => !deleteIds.has(a.id)));
      setDeleteAgents(null);
      setSelectedIds(new Set());
    }
  };

  const closeDeployModal = () => {
    setDeployAgents(null);
    setDeployTarget(null);
  };

  const closeDeleteModal = () => {
    setDeleteAgents(null);
  };

  // Toolbar button states
  const hasSelection = selectedIds.size > 0;
  const hasSingleSelection = selectedIds.size === 1;

  if (loading) {
    return <div className="text-center text-muted">Loading SubAgents...</div>;
  }

  return (
    <div className="flex flex-col gap-md">
      {/* Import button */}
      <button
        className="btn-secondary w-full"
        onClick={() => vscode.postMessage({ command: "agent.import" })}
        type="button"
      >
        Import .subagent file
      </button>

      {/* Empty state */}
      {agents.length === 0 && (
        <div className="mt-md text-center text-muted">
          <p>No SubAgents in library yet.</p>
          <button
            className="btn-primary mt-md"
            onClick={onCreate}
            type="button"
          >
            Create your first SubAgent
          </button>
        </div>
      )}

      {/* Select All checkbox */}
      {agents.length > 0 && (
        <div className="selectall-row">
          <label className="card-checkbox">
            <input
              checked={selectedIds.size === agents.length && agents.length > 0}
              onChange={toggleSelectAll}
              type="checkbox"
            />
          </label>
          <span className="text-muted">
            Select All ({selectedIds.size} / {agents.length})
          </span>
        </div>
      )}

      {/* SubAgent cards with checkboxes */}
      {agents.map((agent) => (
        <AgentCard
          agent={agent}
          isSelected={selectedIds.has(agent.id)}
          key={agent.id}
          onToggle={() => toggleSelection(agent.id)}
        />
      ))}

      {/* Toolbar with action buttons */}
      {agents.length > 0 && (
        <div className="toolbar">
          <button
            className="btn-secondary"
            disabled={!hasSingleSelection}
            onClick={() => {
              const agent = getSelectedAgents()[0];
              if (agent) {
                onEdit(agent);
              }
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="btn-success"
            disabled={!hasSelection}
            onClick={() => setDeployAgents(getSelectedAgents())}
            type="button"
          >
            Deploy
          </button>
          <button
            className="btn-secondary"
            disabled={!hasSelection}
            onClick={handleExport}
            type="button"
          >
            Export
          </button>
          <button
            className="btn-danger"
            disabled={!hasSelection}
            onClick={() => setDeleteAgents(getSelectedAgents())}
            type="button"
          >
            Delete
          </button>
        </div>
      )}

      {/* Deploy Modal */}
      {deployAgents !== null && (
        <DeployModal
          agents={deployAgents}
          onClose={closeDeployModal}
          onDeploy={handleDeploy}
          onTargetChange={setDeployTarget}
          selectedTarget={deployTarget}
        />
      )}

      {/* Delete Modal */}
      {deleteAgents !== null && (
        <DeleteModal
          agents={deleteAgents}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};
