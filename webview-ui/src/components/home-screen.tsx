/**
 * Home Screen - Entry point with Create/Library/Deployed options
 */
type HomeScreenProps = {
  onCreateClick: () => void;
  onLibraryClick: () => void;
  onDeployedClick: () => void;
};

export const HomeScreen = ({
  onCreateClick,
  onLibraryClick,
  onDeployedClick,
}: HomeScreenProps) => (
  <div
    className="container flex flex-col items-center justify-center"
    style={{ minHeight: "80vh" }}
  >
    <h1 className="mb-md text-center">SubAgent Manager</h1>
    <p className="mb-md text-center text-muted">
      Create and manage sub-agents for Codex CLI and Claude Code CLI
    </p>

    <div className="mt-md flex flex-col gap-md" style={{ width: "280px" }}>
      <button
        className="btn-primary btn-large"
        onClick={onCreateClick}
        type="button"
      >
        + Create New
      </button>
      <button
        className="btn-secondary btn-large"
        onClick={onLibraryClick}
        type="button"
      >
        Library
      </button>
      <button
        className="btn-success btn-large"
        onClick={onDeployedClick}
        type="button"
      >
        Deployed
      </button>
    </div>
  </div>
);
