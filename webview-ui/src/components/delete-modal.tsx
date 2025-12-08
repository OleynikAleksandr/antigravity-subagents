import type { SubAgent } from "../models/types";

type DeleteModalProps = {
  agents: SubAgent[];
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Modal dialog for confirming deletion of SubAgents
 */
export const DeleteModal = ({
  agents,
  onConfirm,
  onClose,
}: DeleteModalProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Modal overlay pattern
    <div
      aria-label="Delete confirmation"
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Modal content container */}
      <div
        aria-label="Confirm delete"
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        <h3 className="modal-title">
          Delete {agents.length} SubAgent
          {agents.length > 1 ? "s" : ""}?
        </h3>
        <div className="mb-md text-muted">
          {agents.map((a) => a.name).join(", ")}
        </div>
        <p className="text-muted">This action cannot be undone.</p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} type="button">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
