import type { SubAgent } from "../models/types";

type DeployModalProps = {
  agents: SubAgent[];
  selectedTarget: "project" | "global" | null;
  onTargetChange: (target: "project" | "global") => void;
  onDeploy: () => void;
  onClose: () => void;
};

/**
 * Modal dialog for deploying SubAgents to project or global location
 */
export const DeployModal = ({
  agents,
  selectedTarget,
  onTargetChange,
  onDeploy,
  onClose,
}: DeployModalProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Modal overlay pattern
    <div
      aria-label="Deploy modal"
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Modal content container */}
      <div
        aria-label="Deploy options"
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        <h3 className="modal-title">
          Deploy {agents.length} SubAgent
          {agents.length > 1 ? "s" : ""}
        </h3>

        <div className="mb-md text-muted">
          {agents.map((a) => a.name).join(", ")}
        </div>

        <div className="flex flex-col gap-md">
          <label className="flex items-center gap-sm">
            <input
              checked={selectedTarget === "project"}
              name="deploy-target"
              onChange={() => onTargetChange("project")}
              type="radio"
            />
            <div>
              <div>Project</div>
              <div className="form-hint">.subagents/ in workspace</div>
            </div>
          </label>

          <label className="flex items-center gap-sm">
            <input
              checked={selectedTarget === "global"}
              name="deploy-target"
              onChange={() => onTargetChange("global")}
              type="radio"
            />
            <div>
              <div>Global</div>
              <div className="form-hint">~/.subagents/ for all projects</div>
            </div>
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!selectedTarget}
            onClick={onDeploy}
            type="button"
          >
            Deploy
          </button>
        </div>
      </div>
    </div>
  );
};
