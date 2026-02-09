// WhaleList - Main whale tracker page (ATLAS Design)

import React, { useState, useMemo } from 'react';
import { useTopWhales, useAnalytics } from '../hooks/useWhales';
import WhaleCard from './WhaleCard';
import { EmptyState, WhaleListSkeleton } from './loading';
import '../styles/whale-list.css';

interface WhaleListProps {
  onViewActivity?: (address: string) => void;
  onViewNft?: (tokenId: number) => void;
}

const WhaleList: React.FC<WhaleListProps> = ({ onViewActivity, onViewNft }) => {
  const [sortBy, setSortBy] = useState<'nftCount' | 'value' | 'pl' | 'percentage'>('nftCount');
  const [minNFTs, setMinNFTs] = useState<number>(0);
  const [quickFilter, setQuickFilter] = useState<'all' | 'top10' | 'new' | 'accumulating' | 'selling'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error, refetch } = useTopWhales(50);
  const { data: analyticsData } = useAnalytics();

  // Filter and sort whales
  const filteredWhales = useMemo(() => {
    if (!data) return [];

    let whales = data.whales;

    // Search filter
    if (searchTerm) {
      whales = whales.filter(whale =>
        whale.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        whale.ensName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Min NFTs filter
    if (minNFTs > 0) {
      whales = whales.filter(whale => whale.nftCount >= minNFTs);
    }

    // Quick filters
    if (quickFilter === 'top10') {
      whales = whales.slice(0, 10);
    }

    // Sorting
    const sortMap = {
      nftCount: (a: any, b: any) => b.nftCount - a.nftCount,
      value: (a: any, b: any) => (b.estimatedValueETH || 0) - (a.estimatedValueETH || 0),
      pl: (a: any, b: any) => b.nftCount - a.nftCount, // Mock P/L sort
      percentage: (a: any, b: any) => (b.percentageOfCollection || 0) - (a.percentageOfCollection || 0),
    };

    whales.sort(sortMap[sortBy]);
    return whales;
  }, [data, searchTerm, sortBy, minNFTs, quickFilter]);

  if (isLoading) {
    return (
      <div>
        <WhaleListSkeleton count={10} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Error Loading Data</h2>
          <p className="error-message">
            {error instanceof Error ? error.message : 'Failed to load whale data'}
          </p>
          <button onClick={() => refetch()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* COLLECTION HERO */}
      <div className="collection-hero">
        <div className="collection-avatar">🦍</div>
        <div className="collection-info">
          <h1>
            Mutant Ape Yacht Club <span className="verified">✓</span>
          </h1>
          <div className="contract">
            0x60E4d786628Fea6478F785A6d7e704777c86a7c6 · Ethereum
          </div>
          <div className="collection-meta">
            <div className="collection-meta-item">
              <div className="v">19,423</div>
              <div className="l">Total Supply</div>
            </div>
            <div className="collection-meta-item">
              <div className="v">{data.totalUniqueHolders?.toLocaleString() || 'N/A'}</div>
              <div className="l">Holders</div>
            </div>
            <div className="collection-meta-item">
              <div className="v" style={{ color: 'var(--ok)' }}>
                {data.floorPrice ? `${data.floorPrice.toFixed(3)} ETH` : 'N/A'}
              </div>
              <div className="l">Floor Price</div>
            </div>
            <div className="collection-meta-item">
              <div className="v">{analyticsData?.volume24h ? `${analyticsData.volume24h} ETH` : '—'}</div>
              <div className="l">24h Volume</div>
            </div>
            <div className="collection-meta-item">
              <div className="v">{analyticsData?.distribution?.whales ?? 0}</div>
              <div className="l">Whales (20+)</div>
            </div>
          </div>
        </div>
        <div className="collection-actions">
          <button className="btn btn-primary">🔔 Set Alert</button>
          <button className="btn btn-ghost" onClick={() => window.open('https://opensea.io/collection/mutant-ape-yacht-club', '_blank')}>
            ↗ OpenSea
          </button>
          <button className="btn btn-ghost" onClick={() => window.open('https://etherscan.io/address/0x60E4d786628Fea6478F785A6d7e704777c86a7c6', '_blank')}>
            📋 Etherscan
          </button>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="filters-bar">
        <div className="filter-group">
          <span className="filter-label">Sort by:</span>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="nftCount">NFT Count ↓</option>
            <option value="value">Value (ETH) ↓</option>
            <option value="pl">P/L ↓</option>
            <option value="percentage">% Collection ↓</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Min NFTs:</span>
          <select
            className="filter-select"
            value={minNFTs}
            onChange={(e) => setMinNFTs(Number(e.target.value))}
          >
            <option value="0">Any</option>
            <option value="10">10+</option>
            <option value="25">25+</option>
            <option value="50">50+</option>
          </select>
        </div>

        {/* Quick Filters */}
        <div
          className={`quick-filter ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => setQuickFilter('all')}
        >
          🐋 All Whales
        </div>
        <div
          className={`quick-filter ${quickFilter === 'top10' ? 'active' : ''}`}
          onClick={() => setQuickFilter('top10')}
        >
          🏆 Top 10
        </div>
        <div
          className={`quick-filter ${quickFilter === 'new' ? 'active' : ''}`}
          onClick={() => setQuickFilter('new')}
        >
          🆕 New (7d)
        </div>

        <div className="filters-right">
          <span className="result-count">{filteredWhales.length} whales found</span>
        </div>
      </div>

      {/* WHALE CARDS GRID */}
      {filteredWhales.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No whales found"
          message="Try adjusting your filters"
          actionLabel="Clear Filters"
          onAction={() => { setSearchTerm(''); setMinNFTs(0); setQuickFilter('all'); }}
        />
      ) : (
        <div className="whales-grid">
          {filteredWhales.map((whale) => (
            <WhaleCard
              key={whale.address}
              whale={whale}
              onViewActivity={onViewActivity}
              onViewNft={onViewNft}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default WhaleList;
