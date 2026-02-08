import React, { useState } from 'react';
import { useWhaleActivity, useWhaleEnriched } from '../hooks/useWhales';
import { ActivityEvent, PortfolioCollection } from '../types/whale.types';
import { Spinner, WhaleCardSkeleton } from '../components/loading';

interface WhaleDetailProps {
  address: string;
  onBack: () => void;
  onViewNft?: (tokenId: number) => void;
}

const WhaleDetail: React.FC<WhaleDetailProps> = ({ address, onBack, onViewNft }) => {
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'activity' | 'portfolio'>('portfolio');
  const limit = 50;

  const { data: activityData, isLoading: activityLoading, isError: activityError, error: actError } = useWhaleActivity(address, limit, page * limit);
  const { data: enrichedData, isLoading: enrichedLoading, isError: enrichedError, error: enrError } = useWhaleEnriched(address);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getActionBadge = (action: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      buy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Buy' },
      sell: { bg: 'bg-red-100', text: 'text-red-700', label: 'Sell' },
      mint: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Mint' },
      transfer_in: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Transfer In' },
      transfer_out: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Transfer Out' },
    };
    const badge = badges[action] || { bg: 'bg-gray-100', text: 'text-gray-700', label: action };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (activityLoading || enrichedLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="container mx-auto">
          <div className="mb-6 h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <WhaleCardSkeleton />
        </div>
      </div>
    );
  }

  if (activityError || enrichedError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <button onClick={onBack} className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
          &larr; Back to Whales
        </button>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Failed to load whale data</h2>
          <p className="text-gray-600">{actError instanceof Error ? actError.message : enrError instanceof Error ? enrError.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  if (!activityData || !enrichedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="container mx-auto">
          <div className="mb-6 h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <WhaleCardSkeleton />
        </div>
      </div>
    );
  }

  const whale = enrichedData.whale;
  const totalPages = Math.ceil(activityData.pagination.total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b-2 border-blue-200">
        <div className="container mx-auto px-4 py-6">
          <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            &larr; Back to Whales
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {whale.ensName || formatAddress(whale.address)}
              </h1>
              {whale.ensName && (
                <p className="text-gray-500 font-mono text-sm mt-1">{whale.address}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">#{activityData.rank}</div>
                <div className="text-xs text-gray-500">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{whale.count}</div>
                <div className="text-xs text-gray-500">MAYC NFTs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{parseFloat(whale.ethBalance).toFixed(2)} Ξ</div>
                <div className="text-xs text-gray-500">ETH Balance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'portfolio'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📊 Portfolio ({whale.portfolio.totalNFTs} NFTs)
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'activity'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📜 Activity ({activityData.pagination.total} events)
          </button>
        </div>

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="Total Collections" value={whale.portfolio.totalCollections} color="text-purple-600" />
              <SummaryCard label="Total NFTs" value={whale.portfolio.totalNFTs} color="text-blue-600" />
              <SummaryCard label="Portfolio Value" value={`${whale.portfolioValueETH?.toFixed(2) || '—'} ETH`} color="text-green-600" />
              <SummaryCard label="ETH Balance" value={`${parseFloat(whale.ethBalance).toFixed(3)} ETH`} color="text-orange-600" />
            </div>

            {/* NFT Collections */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">NFT Collections</h2>
                <p className="text-sm text-gray-500">
                  Holding {whale.portfolio.totalCollections} unique collections
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {whale.portfolio.collections.map((collection: PortfolioCollection) => (
                  <PortfolioCollectionCard key={collection.contractAddress} collection={collection} />
                ))}
              </div>
            </div>

            {/* MAYC Holdings */}
            {whale.tokenIds && whale.tokenIds.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">MAYC Token IDs ({whale.tokenIds.length})</h2>
                  <p className="text-sm text-gray-500">
                    Click any token to view details
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {whale.tokenIds.map((tokenId: number) => (
                      <button
                        key={tokenId}
                        onClick={() => onViewNft && onViewNft(tokenId)}
                        className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-blue-100 hover:shadow-md transition-all text-sm font-semibold text-purple-700"
                      >
                        #{tokenId}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <SummaryCard label="Total Events" value={activityData.summary.totalEvents} color="text-gray-900" />
              <SummaryCard label="Buys" value={activityData.summary.buys} color="text-green-600" />
              <SummaryCard label="Sells" value={activityData.summary.sells} color="text-red-600" />
              <SummaryCard label="Mints" value={activityData.summary.mints} color="text-purple-600" />
              <SummaryCard label="Volume" value={`${activityData.summary.volumeETH.toFixed(2)} ETH`} color="text-blue-600" />
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
                <p className="text-sm text-gray-500">
                  Showing {activityData.activity.length} of {activityData.pagination.total} events
                </p>
              </div>

              {activityData.activity.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-4xl mb-4">🔍</div>
                  <p>No activity found for this address</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activityData.activity.map((event: ActivityEvent, idx: number) => (
                    <div key={`${event.txHash}-${event.tokenId}-${idx}`} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          {getActionBadge(event.action)}
                          <div>
                            <span className="font-medium text-gray-900">MAYC #{event.tokenId}</span>
                            {onViewNft && (
                              <button
                                onClick={() => onViewNft(event.tokenId)}
                                className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                              >
                                View NFT
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          {event.priceETH !== null && event.priceETH > 0 && (
                            <span className="font-semibold text-gray-900">{event.priceETH.toFixed(4)} ETH</span>
                          )}

                          <span className="text-gray-500">
                            {event.action === 'buy' || event.action === 'transfer_in' ? 'from ' : 'to '}
                            <a
                              href={`https://etherscan.io/address/${event.counterparty}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline font-mono"
                            >
                              {formatAddress(event.counterparty)}
                            </a>
                          </span>

                          <a
                            href={`https://etherscan.io/tx/${event.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-500"
                            title="View on Etherscan"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>

                          <span className="text-gray-400 text-xs whitespace-nowrap">{formatTime(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div className="bg-white rounded-xl shadow-md p-4">
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

const PortfolioCollectionCard: React.FC<{ collection: PortfolioCollection }> = ({ collection }) => {
  const hasFloorPrice = collection.floorPrice !== null && collection.floorPrice > 0;
  const hasValue = collection.estimatedValueETH !== null && collection.estimatedValueETH > 0;

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Collection Image */}
        {collection.image ? (
          <img
            src={collection.image}
            alt={collection.name}
            className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=NFT';
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-2xl">
            🖼️
          </div>
        )}

        {/* Collection Info */}
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{collection.name}</h3>
          <p className="text-sm text-gray-500">
            {collection.symbol} • {collection.tokenType}
          </p>
          <a
            href={`https://etherscan.io/address/${collection.contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline font-mono"
          >
            {collection.contractAddress.slice(0, 10)}...
          </a>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{collection.count}</div>
          <div className="text-xs text-gray-500">NFTs</div>
          {hasFloorPrice && collection.floorPrice && (
            <div className="text-sm text-gray-600 mt-1">
              Floor: {collection.floorPrice.toFixed(4)} ETH
            </div>
          )}
          {hasValue && collection.estimatedValueETH && (
            <div className="text-sm font-semibold text-green-600">
              ≈ {collection.estimatedValueETH.toFixed(2)} ETH
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhaleDetail;
