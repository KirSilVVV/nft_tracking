// WhaleCard - Advanced whale card component (ATLAS Design)

import React, { useState } from 'react';
import { Whale } from '../types/whale.types';
import '../styles/whale-cards.css';

interface WhaleCardProps {
  whale: Whale;
  onViewActivity?: (address: string) => void;
  onViewNft?: (tokenId: number) => void;
}

const WhaleCard: React.FC<WhaleCardProps> = ({ whale, onViewActivity, onViewNft }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Rank-specific CSS class
  const getRankClass = (): string => {
    if (whale.rank === 1) return 'rank-1';
    if (whale.rank === 2) return 'rank-2';
    if (whale.rank === 3) return 'rank-3';
    return '';
  };

  // Rank badge CSS class
  const getRankBadgeClass = (): string => {
    if (whale.rank === 1) return 'rb1';
    if (whale.rank === 2) return 'rb2';
    if (whale.rank === 3) return 'rb3';
    return 'rbn';
  };

  // Get whale tag based on NFT count
  const getWhaleTag = (): string | null => {
    if (whale.nftCount >= 100) return '🐋 Mega Whale';
    if (whale.nftCount >= 50) return '🐋 Whale';
    if (whale.nftCount >= 20) return '🐳 Big Fish';
    return null;
  };

  // Format dates
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div
      className={`whale-card ${getRankClass()} ${isExpanded ? 'open' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Top Section: Rank + Identity + Quick Stats */}
      <div className="whale-card-top">
        {/* Rank Badge */}
        <div className={`whale-rank-badge ${getRankBadgeClass()}`}>
          #{whale.rank}
        </div>

        {/* Identity */}
        <div className="whale-identity">
          <div className="whale-ens">
            {whale.ensName || '—'}
            {getWhaleTag() && <span className="whale-tag">{getWhaleTag()}</span>}
          </div>
          <div className="whale-address">
            {formatAddress(whale.address)}
            <button
              className="copy-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(whale.address);
              }}
              title="Copy address"
            >
              📋
            </button>
          </div>
          {/* Quick stats removed - blockchain data limited to recent 7 days */}
        </div>
      </div>

      {/* Body Section: 3-column metrics */}
      <div className="whale-card-body">
        <div className="wm">
          <div className="l">NFTs Held</div>
          <div className="v">{whale.nftCount}</div>
        </div>
        <div className="wm">
          <div className="l">Est. Value</div>
          <div className="v">
            {typeof whale.estimatedValueETH === 'number'
              ? whale.estimatedValueETH.toFixed(0)
              : Math.floor(parseFloat(whale.estimatedValueETH as string))} ETH
          </div>
        </div>
        <div className="wm">
          <div className="l">ETH Balance</div>
          <div className="v" style={{ color: 'var(--t1)' }}>
            {whale.ethBalance !== null && whale.ethBalance !== undefined
              ? `${whale.ethBalance.toFixed(4)} ETH`
              : '—'}
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className="whale-card-bar">
        <div className="bar-label">
          <span>
            {whale.percentageOfCollection ? whale.percentageOfCollection.toFixed(2) : '0.00'}% of collection
          </span>
          <span style={{ color: 'var(--t3)' }}>
            {whale.nftCount} NFTs
          </span>
        </div>
        <div className="bar-track">
          <div
            className="bar-fill"
            style={{
              width: `${Math.min(
                (whale.percentageOfCollection || 0) * 6,
                100
              )}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Expandable Section: Token IDs + Activity */}
      {isExpanded && (
        <div className="whale-card-expanded">
          <div className="expanded-content">
            {/* Token IDs */}
            {whale.nftIds && whale.nftIds.length > 0 && (
              <>
                <div className="expanded-title">Token IDs (showing first 10)</div>
                <div className="token-ids">
                  {whale.nftIds.slice(0, 10).map((id) => (
                    <span
                      key={id}
                      className="token-id"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewNft) {
                          onViewNft(id);
                        }
                      }}
                      style={{ cursor: onViewNft ? 'pointer' : 'default' }}
                      title={onViewNft ? `View MAYC #${id}` : undefined}
                    >
                      #{id}
                    </span>
                  ))}
                  {whale.nftIds.length > 10 && (
                    <span className="token-id" style={{ opacity: 0.5 }}>
                      +{whale.nftIds.length - 10} more
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Whale Stats */}
            <div className="expanded-title" style={{ marginTop: '14px' }}>
              Whale Statistics
            </div>
            <div className="whale-stats-grid">
              <div className="stat-mini">
                <div className="stat-mini-label">First Seen</div>
                <div className="stat-mini-value">{formatDate(whale.firstSeen)}</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-label">Last Activity</div>
                <div className="stat-mini-value">{formatDate(whale.lastActivity)}</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-label">ETH Balance</div>
                <div className="stat-mini-value">
                  {whale.ethBalance !== null ? `${whale.ethBalance.toFixed(4)} ETH` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section: Links + View Button */}
      <div className="whale-card-footer">
        <div className="whale-links">
          <a
            className="whale-link"
            href={`https://etherscan.io/address/${whale.address}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Etherscan ↗
          </a>
          <a
            className="whale-link"
            href={`https://opensea.io/${whale.address}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            OpenSea ↗
          </a>
        </div>
        {onViewActivity && (
          <button
            className="whale-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewActivity(whale.address);
            }}
          >
            View Full History →
          </button>
        )}
      </div>
    </div>
  );
};

export default WhaleCard;
