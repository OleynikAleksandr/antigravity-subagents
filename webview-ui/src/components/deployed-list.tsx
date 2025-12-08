import { useEffect, useState } from "react";
import { vscode } from "../api/vscode";
import type { SubAgent } from "../models/types";
import { AgentCard } from "./agent-card";
import { DeleteModal } from "./delete-modal";
import { SaveToLibraryModal } from "./save-to-library-modal";

/**
 * Deployed SubAgent with source info
 */
type DeployedSubAgent = SubAgent & {
  source: "project" | "global";
  agentDir: string;
};

type DeployedListProps = {
  onEdit: (agent: SubAgent) => void;
};

/**
 * Deployed Screen - List of deployed SubAgents from .subagents/
 */
export const DeployedList = ({ onEdit }: DeployedListProps) => {
  const [projectAgents, setProjectAgents] = useState<DeployedSubAgent[]>([]);
  const [globalAgents, setGlobalAgents] = useState<DeployedSubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteAgents, setDeleteAgents] = useState<DeployedSubAgent[] | null>(
    null
  );
  const [saveToLibrary, setSaveToLibrary] = useState<DeployedSubAgent | null>(
    null
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "deployed.list.result") {
        setProjectAgents(message.payload.project);
        setGlobalAgents(message.payload.global);
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({ command: "deployed.list" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const allAgents = [...projectAgents, ...globalAgents];

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

  const getSelectedAgents = (): DeployedSubAgent[] =>
    allAgents.filter((a) => selectedIds.has(a.id));

  const handleDeleteConfirm = () => {
    if (deleteAgents) {
      for (const agent of deleteAgents) {
        vscode.postMessage({
          command: "deployed.undeploy",
          payload: { name: agent.name, source: agent.source },
        });
      }
      // Remove from local state
      const deleteIds = new Set(deleteAgents.map((a) => a.id));
      setProjectAgents(projectAgents.filter((a) => !deleteIds.has(a.id)));
      setGlobalAgents(globalAgents.filter((a) => !deleteIds.has(a.id)));
      setDeleteAgents(null);
      setSelectedIds(new Set());
    }
  };

  const handleSaveToLibrary = (overwrite: boolean) => {
    if (saveToLibrary) {
      vscode.postMessage({
        command: "deployed.saveToLibrary",
        payload: { agent: saveToLibrary, overwrite },
      });
      setSaveToLibrary(null);
    }
  };

  const hasSelection = selectedIds.size > 0;
  const hasSingleSelection = selectedIds.size === 1;

  if (loading) {
    return (
      <div className="text-center text-muted">
        Loading deployed SubAgents...
      </div>
    );
  }

  const renderAgentCard = (agent: DeployedSubAgent) => (
    <AgentCard
      agent={agent}
      isSelected={selectedIds.has(agent.id)}
      key={agent.id}
      onToggle={() => toggleSelection(agent.id)}
    />
  );

  return (
    <div className="flex flex-col gap-md">
      {/* Empty state */}
      {allAgents.length === 0 && (
        <div className="mt-md text-center text-muted">
          <p>No deployed SubAgents found.</p>
          <p className="mt-md">Deploy SubAgents from the Library.</p>
        </div>
      )}

      {/* Select All checkbox */}
      {allAgents.length > 0 && (
        <div className="selectall-row">
          <label className="card-checkbox">
            <input
              checked={selectedIds.size === allAgents.length}
              onChange={() => {
                if (selectedIds.size === allAgents.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(allAgents.map((a) => a.id)));
                }
              }}
              type="checkbox"
            />
          </label>
          <span className="text-muted">Select All</span>
        </div>
      )}

      {/* Project agents */}
      {projectAgents.length > 0 && (
        <>
          <h3 className="text-muted">Project (.subagents/)</h3>
          {projectAgents.map(renderAgentCard)}
        </>
      )}

      {/* Global agents */}
      {globalAgents.length > 0 && (
        <>
          <h3 className="text-muted">Global (~/.subagents/)</h3>
          {globalAgents.map(renderAgentCard)}
        </>
      )}

      {/* Toolbar */}
      {allAgents.length > 0 && (
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
            className="btn-secondary"
            disabled={!hasSingleSelection}
            onClick={() => {
              const agent = getSelectedAgents()[0];
              if (agent) {
                setSaveToLibrary(agent);
              }
            }}
            type="button"
          >
            Save to Library
          </button>
          <button
            className="btn-danger"
            disabled={!hasSelection}
            onClick={() => setDeleteAgents(getSelectedAgents())}
            type="button"
          >
            Undeploy
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteAgents !== null && (
        <DeleteModal
          agents={deleteAgents}
          onClose={() => setDeleteAgents(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Save to Library Modal */}
      {saveToLibrary !== null && (
        <SaveToLibraryModal
          agentName={saveToLibrary.name}
          onCancel={() => setSaveToLibrary(null)}
          onSave={handleSaveToLibrary}
        />
      )}
    </div>
  );
};
