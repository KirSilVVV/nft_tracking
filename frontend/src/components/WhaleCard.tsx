// WhaleCard - Advanced whale card component (ATLAS Design)

import React, { useState } from 'react';
import { Whale } from '../types/whale.types';
import { WalletIdentity } from '../types/identity.types';
import WalletIdentityBadge from './identity/WalletIdentityBadge';
import '../styles/whale-cards.css';

interface WhaleCardProps {
  whale: Whale;
  onViewActivity?: (address: string) => void;
  onViewNft?: (tokenId: number) => void;
}

const WhaleCard: React.FC<WhaleCardProps> = ({ whale, onViewActivity, onViewNft }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Copy address to clipboard
  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(whale.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert Whale data to partial WalletIdentity for badge
  const getPartialIdentity = (): Partial<WalletIdentity> | null => {
    if (!whale.ensName && !whale.twitter) {
      return null; // Let badge fetch identity
    }

    // Determine labels based on whale NFT count
    const labels: Array<'whale' | 'mega_whale' | 'known_collector'> = [];
    if (whale.nftCount >= 100) labels.push('mega_whale');
    else if (whale.nftCount >= 20) labels.push('whale');

    return {
      address: whale.address,
      ensName: whale.ensName || null,
      ensAvatar: whale.ensAvatar || null,
      twitter: whale.twitter || null,
      email: whale.email || null,
      displayName: whale.ensName || null,
      labels: labels as any,
      identityScore: whale.ensName ? 70 : 40,
      sources: whale.ensName ? ['ens' as const] : [],
      resolvedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    } as Partial<WalletIdentity>;
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

  // Format ETH balance (remove unnecessary zeros)
  const formatETH = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    if (value === 0) return '0 ETH';
    if (value >= 100) return `${value.toFixed(2)} ETH`;
    if (value >= 1) return `${value.toFixed(2)} ETH`;
    return `${value.toFixed(4)} ETH`; // for small balances
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

        {/* Identity Badge */}
        <div className="whale-identity" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WalletIdentityBadge
              address={whale.address}
              mode="compact"
              showSocials={false}
              showTooltip={true}
              identity={getPartialIdentity() as WalletIdentity}
            />
            <button
              className="copy-btn"
              onClick={copyAddress}
              title={copied ? 'Copied!' : 'Copy address'}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? 'var(--ok)' : 'var(--t3)',
                cursor: 'pointer',
                opacity: copied ? 1 : 0.5,
                transition: 'all 0.2s',
                fontSize: '14px',
              }}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          {getWhaleTag() && (
            <span className="whale-tag" style={{ marginLeft: '8px' }}>
              {getWhaleTag()}
            </span>
          )}
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
            {formatETH(whale.ethBalance)}
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
                <div className="stat-mini-label">NFT Count</div>
                <div className="stat-mini-value">{whale.nftCount}</div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-label">Collection %</div>
                <div className="stat-mini-value">
                  {whale.percentageOfCollection ? whale.percentageOfCollection.toFixed(2) : '0.00'}%
                </div>
              </div>
              <div className="stat-mini">
                <div className="stat-mini-label">ETH Balance</div>
                <div className="stat-mini-value">
                  {formatETH(whale.ethBalance)}
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
