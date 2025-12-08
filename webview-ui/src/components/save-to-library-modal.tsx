import { useEffect, useState } from "react";
import { vscode } from "../api/vscode";

type SaveToLibraryModalProps = {
  agentName: string;
  onSave: (overwrite: boolean) => void;
  onCancel: () => void;
};

/**
 * Render modal content based on state
 */
const renderModalContent = (
  checking: boolean,
  exists: boolean,
  agentName: string
) => {
  if (checking) {
    return <p className="text-muted">Checking library...</p>;
  }
  if (exists) {
    return (
      <>
        <p className="text-muted">
          SubAgent "{agentName}" already exists in Library.
        </p>
        <p className="mt-md text-muted">Do you want to overwrite it?</p>
      </>
    );
  }
  return <p className="text-muted">Save "{agentName}" to Library?</p>;
};

/**
 * Modal for saving deployed SubAgent to Library
 * Checks for duplicates and asks for confirmation
 */
export const SaveToLibraryModal = ({
  agentName,
  onSave,
  onCancel,
}: SaveToLibraryModalProps) => {
  const [checking, setChecking] = useState(true);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "library.checkExists.result") {
        setExists(message.payload.exists);
        setChecking(false);
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({
      command: "library.checkExists",
      payload: { name: agentName },
    });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [agentName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Modal overlay pattern
    <div
      aria-label="Save to Library modal"
      className="modal-overlay"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Modal content container */}
      <div
        aria-label="Save options"
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        <h3 className="modal-title">Save to Library</h3>

        {renderModalContent(checking, exists, agentName)}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
          {!checking && (
            <button
              className="btn-primary"
              onClick={() => onSave(exists)}
              type="button"
            >
              {exists ? "Overwrite" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
