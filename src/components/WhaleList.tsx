import React, { useState, useMemo } from 'react';
import { useTopWhales, useAnalytics } from '../hooks/useWhales';
import WhaleCard from './WhaleCard';
import SearchBar from './SearchBar';
import WhaleFilters from './WhaleFilters';
import { WhaleListSkeleton } from './loading';

interface FilterOptions {
  sortBy: 'nftCount' | 'value' | 'balance' | 'percentage';
  minNFTs: number;
  maxNFTs: number;
  hasENS: boolean;
}

interface WhaleListProps {
  onViewActivity?: (address: string) => void;
  onViewNft?: (tokenId: number) => void;
}

const WhaleList: React.FC<WhaleListProps> = ({ onViewActivity, onViewNft }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'nftCount',
    minNFTs: 1,
    maxNFTs: 1000,
    hasENS: false,
  });
  const { data, isLoading, isError, error, refetch } = useTopWhales(50);
  // Fetch analytics to get actual whale count from blockchain
  const { data: analyticsData } = useAnalytics();

  // Filter and sort whales - MUST be before early returns
  const filteredWhales = useMemo(() => {
    if (!data) return [];

    let whales = data.whales;

    // Search filter
    whales = whales.filter(whale =>
      whale.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whale.ensName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // NFT count range filter
    whales = whales.filter(whale =>
      whale.nftCount >= filters.minNFTs && whale.nftCount <= filters.maxNFTs
    );

    // ENS filter
    if (filters.hasENS) {
      whales = whales.filter(whale => whale.ensName);
    }

    // Sorting
    const sortMap = {
      nftCount: (a: typeof data.whales[0], b: typeof data.whales[0]) => b.nftCount - a.nftCount,
      value: (a: typeof data.whales[0], b: typeof data.whales[0]) =>
        (b.estimatedValueETH || 0) - (a.estimatedValueETH || 0),
      balance: (a: typeof data.whales[0], b: typeof data.whales[0]) =>
        (b.ethBalance || 0) - (a.ethBalance || 0),
      percentage: (a: typeof data.whales[0], b: typeof data.whales[0]) =>
        (b.percentageOfCollection || 0) - (a.percentageOfCollection || 0),
    };

    whales.sort(sortMap[filters.sortBy]);
    return whales;
  }, [data, searchTerm, filters]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="container mx-auto">
          <WhaleListSkeleton count={10} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load whale data'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="container mx-auto">
          <WhaleListSkeleton count={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b-2 border-blue-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            🐋 MAYC Whale Tracker
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Track and analyze the largest holders of Mutant Ape Yacht Club NFTs
          </p>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-6 text-sm md:text-base">
            <div>
              <span className="text-gray-500">Total Holders: </span>
              <span className="font-semibold text-gray-900">{data.totalUniqueHolders.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Floor Price: </span>
              <span className="font-semibold text-blue-600">{data.floorPrice ? `${data.floorPrice.toFixed(2)} ETH` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Updated: </span>
              <span className="font-semibold text-gray-900">
                {new Date(data.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Source: </span>
              <span className="font-semibold text-green-600">{data.cachedAt ? '📦 Cached' : '🔄 Fresh'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <WhaleFilters
          currentFilters={filters}
          onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
        />

        {/* Search Bar */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by Ethereum address or ENS name..."
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Top Whale Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200">
            <div className="text-sm text-yellow-700 font-medium mb-2">🥇 Top Whale</div>
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {data.whales[0]?.nftCount || 0}
            </div>
            <div className="text-sm text-yellow-600">
              {data.whales[0]?.ensName || 'NFTs'}
            </div>
          </div>

          {/* Total Whales Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <div className="text-sm text-blue-700 font-medium mb-2">🐋 Whales (20+ NFTs)</div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {analyticsData?.distribution?.whales ?? data.whales.length}
            </div>
            <div className="text-sm text-blue-600">
              {analyticsData?.distribution?.whales ? 'in blockchain' : 'showing top 50'}
            </div>
          </div>

          {/* Floor Price Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
            <div className="text-sm text-green-700 font-medium mb-2">💎 Floor Price</div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {data.floorPrice ? data.floorPrice.toFixed(2) : 'N/A'}
            </div>
            <div className="text-sm text-green-600">
              ETH
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {searchTerm ? `Search Results (${filteredWhales.length})` : `Top 50 Whales (${filteredWhales.length})`}
          </h2>

          {filteredWhales.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No whales found
              </h3>
              <p className="text-gray-600 mb-4">
                No matching results for "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWhales.map((whale) => (
                <WhaleCard key={whale.address} whale={whale} onViewActivity={onViewActivity} onViewNft={onViewNft} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>Data powered by Alchemy | Last synced: {new Date(data.lastUpdated).toLocaleString()}</p>
          <p className="mt-2 text-gray-500">
            Data refreshes every ~2 minutes from blockchain. Whales are wallets holding 20+ MAYC NFTs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhaleList;
