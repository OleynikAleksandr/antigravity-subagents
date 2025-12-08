import type { SubAgent } from "../models/types";

type AgentCardProps = {
  agent: SubAgent;
  isSelected: boolean;
  onToggle: () => void;
};

/**
 * Reusable card component for SubAgent display
 */
export const AgentCard = ({ agent, isSelected, onToggle }: AgentCardProps) => (
  <div className="card card-selectable">
    <label className="card-checkbox">
      <input checked={isSelected} onChange={onToggle} type="checkbox" />
    </label>
    <div className="card-content">
      <div className="card-header">
        <div>
          <div className="card-title">{agent.name}</div>
          <div className="card-description">{agent.description}</div>
        </div>
        <span className={`badge badge-${agent.vendor}`}>{agent.vendor}</span>
      </div>
    </div>
  </div>
);
