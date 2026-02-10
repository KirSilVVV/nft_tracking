// WalletIdentityBadge - Compact identity display with avatar, ENS, Twitter
// Shows enriched wallet information instead of raw addresses

import React, { useState, useEffect } from 'react';
import { WalletIdentity } from '../../types/identity.types';
import IdentityTooltip from './IdentityTooltip';
import SocialLinks from './SocialLinks';
import './WalletIdentityBadge.css';

interface WalletIdentityBadgeProps {
  /** Ethereum address */
  address: string;

  /** Display mode */
  mode?: 'full' | 'compact' | 'minimal';

  /** Show social links */
  showSocials?: boolean;

  /** Show tooltip on hover */
  showTooltip?: boolean;

  /** Pre-fetched identity data (optional) */
  identity?: WalletIdentity | null;

  /** Custom class name */
  className?: string;

  /** Click handler */
  onClick?: () => void;
}

const WalletIdentityBadge: React.FC<WalletIdentityBadgeProps> = ({
  address,
  mode = 'full',
  showSocials = true,
  showTooltip = true,
  identity: propIdentity,
  className = '',
  onClick,
}) => {
  const [identity, setIdentity] = useState<WalletIdentity | null>(propIdentity || null);
  const [loading, setLoading] = useState(!propIdentity);
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Fetch identity if not provided
  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';
        const response = await fetch(`${API_BASE}/api/identity/${address}?quick=true`);
        const data = await response.json();

        if (data.success) {
          setIdentity(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch identity:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!propIdentity && address) {
      fetchIdentity();
    }
  }, [address, propIdentity]);

  // Truncate address: 0x1234...5678
  const truncateAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Get display name (priority: displayName > ensName > truncated address)
  const getDisplayName = (): string => {
    if (identity?.displayName) return identity.displayName;
    if (identity?.ensName) return identity.ensName;
    return truncateAddress(address);
  };

  // Get label color
  const getLabelColor = (label: string): string => {
    const colors: Record<string, string> = {
      'mega_whale': 'var(--gold)',
      'whale': 'var(--accent)',
      'known_collector': 'var(--ok)',
      'fund': 'var(--info)',
      'exchange': 'var(--warn)',
      'new_whale': 'var(--accent)',
      'selling': 'var(--no)',
      'buying': 'var(--ok)',
    };
    return colors[label] || 'var(--text-3)';
  };

  // Render avatar
  const renderAvatar = () => {
    if (identity?.ensAvatar) {
      return (
        <img
          src={identity.ensAvatar}
          alt={getDisplayName()}
          className="identity-avatar"
        />
      );
    }

    // Default gradient avatar based on address
    const hue = parseInt(address.substring(2, 8), 16) % 360;
    return (
      <div
        className="identity-avatar identity-avatar-gradient"
        style={{ background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 60}, 70%, 60%))` }}
      >
        {getDisplayName().substring(0, 2).toUpperCase()}
      </div>
    );
  };

  // Render labels
  const renderLabels = () => {
    if (!identity?.labels || identity.labels.length === 0) return null;

    // Show max 2 labels in compact mode
    const labelsToShow = mode === 'compact' ? identity.labels.slice(0, 2) : identity.labels;

    return (
      <div className="identity-labels">
        {labelsToShow.map((label) => (
          <span
            key={label}
            className="identity-label"
            style={{
              borderColor: getLabelColor(label),
              color: getLabelColor(label),
            }}
          >
            {label.replace('_', ' ')}
          </span>
        ))}
      </div>
    );
  };

  if (loading && !identity) {
    return (
      <div className={`wallet-identity-badge wallet-identity-badge-loading ${className}`}>
        <div className="identity-avatar identity-avatar-skeleton"></div>
        <div className="identity-info">
          <div className="identity-name identity-name-skeleton"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`wallet-identity-badge wallet-identity-badge-${mode} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      {/* Avatar */}
      {mode !== 'minimal' && renderAvatar()}

      {/* Identity Info */}
      <div className="identity-info">
        <div className="identity-name">
          {getDisplayName()}

          {/* Identity Score Badge */}
          {identity && identity.identityScore >= 80 && (
            <span className="identity-verified" title={`Identity Score: ${identity.identityScore}`}>
              ✓
            </span>
          )}
        </div>

        {/* Secondary info (address or twitter) */}
        {mode === 'full' && (
          <div className="identity-secondary">
            {identity?.twitter ? (
              <span className="identity-twitter">@{identity.twitter}</span>
            ) : (
              <span className="identity-address">{truncateAddress(address)}</span>
            )}
          </div>
        )}

        {/* Labels */}
        {mode === 'full' && renderLabels()}
      </div>

      {/* Social Links */}
      {showSocials && mode === 'full' && identity && (
        <SocialLinks identity={identity} />
      )}

      {/* Tooltip */}
      {showTooltip && showTooltipState && identity && (
        <IdentityTooltip identity={identity} />
      )}
    </div>
  );
};

export default WalletIdentityBadge;
