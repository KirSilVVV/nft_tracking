// IdentityTooltip - Detailed identity information on hover
// Shows full profile with all social links and metadata

import React from 'react';
import { WalletIdentity } from '../../types/identity.types';
import './IdentityTooltip.css';

interface IdentityTooltipProps {
  identity: WalletIdentity;
}

const IdentityTooltip: React.FC<IdentityTooltipProps> = ({ identity }) => {
  // Format date for "Resolved X ago"
  const getResolvedAgo = (): string => {
    const resolved = new Date(identity.resolvedAt);
    const now = new Date();
    const diffMs = now.getTime() - resolved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--ok)';
    if (score >= 50) return 'var(--accent)';
    return 'var(--text-3)';
  };

  // Truncate address
  const truncateAddress = (addr: string): string => {
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 8)}`;
  };

  return (
    <div className="identity-tooltip">
      {/* Header */}
      <div className="identity-tooltip-header">
        {identity.ensAvatar && (
          <img src={identity.ensAvatar} alt={identity.displayName || ''} className="tooltip-avatar" />
        )}
        <div className="tooltip-header-info">
          <div className="tooltip-name">{identity.displayName || 'Unknown'}</div>
          {identity.ensName && (
            <div className="tooltip-ens">{identity.ensName}</div>
          )}
        </div>
        <div
          className="tooltip-score"
          style={{ color: getScoreColor(identity.identityScore) }}
        >
          {identity.identityScore}
        </div>
      </div>

      {/* Address */}
      <div className="tooltip-section">
        <div className="tooltip-label">Address</div>
        <div className="tooltip-value tooltip-address">
          {truncateAddress(identity.address)}
          <button
            className="tooltip-copy"
            onClick={() => navigator.clipboard.writeText(identity.address)}
            title="Copy address"
          >
            📋
          </button>
        </div>
      </div>

      {/* Social Links */}
      {(identity.twitter || identity.farcaster || identity.lens) && (
        <div className="tooltip-section">
          <div className="tooltip-label">Social</div>
          <div className="tooltip-socials">
            {identity.twitter && (
              <a
                href={`https://twitter.com/${identity.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tooltip-social-link"
              >
                🐦 @{identity.twitter}
              </a>
            )}
            {identity.farcaster && (
              <a
                href={`https://warpcast.com/${identity.farcaster}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tooltip-social-link"
              >
                🟣 {identity.farcaster}
              </a>
            )}
            {identity.lens && (
              <a
                href={`https://hey.xyz/u/${identity.lens}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tooltip-social-link"
              >
                🌿 {identity.lens}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Labels */}
      {identity.labels && identity.labels.length > 0 && (
        <div className="tooltip-section">
          <div className="tooltip-label">Labels</div>
          <div className="tooltip-labels">
            {identity.labels.map((label) => (
              <span key={label} className="tooltip-label-badge">
                {label.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      <div className="tooltip-section">
        <div className="tooltip-label">Sources</div>
        <div className="tooltip-sources">
          {identity.sources.map((source) => (
            <span key={source} className="tooltip-source-badge">
              {source === 'local_db' ? 'Curated DB' : source.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="tooltip-footer">
        <span className="tooltip-resolved">Resolved {getResolvedAgo()}</span>
      </div>
    </div>
  );
};

export default IdentityTooltip;
