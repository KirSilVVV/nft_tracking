import React, { useState } from 'react';
import { useWhaleEnriched } from '../hooks/useWhales';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Spinner } from '../components/loading';

const PortfolioAnalyzer: React.FC = () => {
  const [inputAddress, setInputAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useWhaleEnriched(searchAddress || '');

  const handleSearch = () => {
    if (inputAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      setSearchAddress(inputAddress);
    } else {
      alert('Invalid Ethereum address. Please enter a valid 0x... address.');
    }
  };

  const handleClear = () => {
    setInputAddress('');
    setSearchAddress(null);
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Sample addresses for quick testing
  const sampleAddresses = [
    { label: 'Top MAYC Whale', address: '0x33a9a08354d4964ffcea90686f2999b02b2f81a6' },
    { label: 'Vitalik.eth', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔍 Portfolio Analyzer
          </h1>
          <p className="text-gray-600">
            Analyze any Ethereum address NFT portfolio
          </p>
        </div>

        {/* Search Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Ethereum Address
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="0x..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={!inputAddress}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Analyze
            </button>
            {searchAddress && (
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sample Addresses */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Quick test:</span>
            {sampleAddresses.map((sample) => (
              <button
                key={sample.address}
                onClick={() => {
                  setInputAddress(sample.address);
                  setSearchAddress(sample.address);
                }}
                className="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Analyzing portfolio...</p>
          </div>
        )}

        {/* Error State */}
        {isError && searchAddress && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Failed to load portfolio</h2>
            <p className="text-gray-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <p className="text-sm text-gray-500 mt-2">
              The address may not hold any NFTs or the enrichment service is unavailable.
            </p>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <div className="space-y-6">
            {/* Address Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {data.whale.ensName || formatAddress(data.whale.address)}
                  </h2>
                  {data.whale.ensName && (
                    <p className="text-gray-500 font-mono text-sm mt-1">{data.whale.address}</p>
                  )}
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {parseFloat(data.whale.ethBalance).toFixed(3)} Ξ
                    </div>
                    <div className="text-xs text-gray-500">ETH Balance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{data.whale.portfolio.totalNFTs}</div>
                    <div className="text-xs text-gray-500">Total NFTs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.whale.portfolio.totalCollections}</div>
                    <div className="text-xs text-gray-500">Collections</div>
                  </div>
                </div>
              </div>

              {/* Enrichment Status */}
              <div className="mt-4 flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    data.whale.enrichmentStatus === 'complete'
                      ? 'bg-green-500'
                      : data.whale.enrichmentStatus === 'partial'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-xs text-gray-600">
                  Enrichment: {data.whale.enrichmentStatus}
                </span>
                <span className="text-xs text-gray-400">
                  • Last updated: {new Date(data.whale.enrichedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Portfolio Visualization & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Portfolio Distribution</h3>
                <PortfolioPieChart portfolio={data.whale.portfolio} />
              </div>

              {/* Portfolio Value */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Portfolio Value</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Total Portfolio Value</p>
                    <p className="text-3xl font-bold text-green-600">
                      {data.whale.portfolioValueETH?.toFixed(2) || '—'} ETH
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Collections</p>
                      <p className="text-xl font-bold text-purple-600">{data.whale.portfolio.totalCollections}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">NFTs</p>
                      <p className="text-xl font-bold text-blue-600">{data.whale.portfolio.totalNFTs}</p>
                    </div>
                  </div>

                  {/* Top Collection */}
                  {data.whale.portfolio.collections.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">🏆 Largest Collection</p>
                      <p className="font-semibold text-gray-900">
                        {data.whale.portfolio.collections[0].name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {data.whale.portfolio.collections[0].count} NFTs
                        {data.whale.portfolio.collections[0].estimatedValueETH && (
                          <span className="text-green-600 ml-2">
                            (≈ {data.whale.portfolio.collections[0].estimatedValueETH.toFixed(2)} ETH)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Collections List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">🎨 NFT Collections</h3>
                <p className="text-sm text-gray-500">Detailed breakdown of all holdings</p>
              </div>

              {data.whale.portfolio.collections.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-4xl mb-4">📭</div>
                  <p>No NFT collections found for this address</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.whale.portfolio.collections.map((collection, index) => (
                    <CollectionRow key={collection.contractAddress} collection={collection} rank={index + 1} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchAddress && !isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter an address to analyze</h2>
            <p className="text-gray-600 mb-6">
              Discover NFT portfolios, ETH balances, and collection breakdowns
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <div className="bg-purple-50 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-purple-900 mb-1">✨ Features</p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• View all NFT collections</li>
                  <li>• Portfolio value estimation</li>
                  <li>• Visual distribution charts</li>
                  <li>• ENS name resolution</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Portfolio Pie Chart Component
const PortfolioPieChart: React.FC<{ portfolio: any }> = ({ portfolio }) => {
  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];

  const data = portfolio.collections
    .map((collection: any, index: number) => ({
      name: collection.name,
      value: collection.count,
      color: COLORS[index % COLORS.length],
    }))
    .slice(0, 7); // Top 7 collections

  if (data.length === 0) {
    return <p className="text-gray-500 text-center py-12">No collections to display</p>;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / portfolio.totalNFTs) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} NFTs ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={(entry: any) => {
            const percentage = (entry.value / portfolio.totalNFTs) * 100;
            return percentage > 5 ? `${percentage.toFixed(0)}%` : '';
          }}
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Collection Row Component
const CollectionRow: React.FC<{ collection: any; rank: number }> = ({ collection, rank }) => {
  const hasFloorPrice = collection.floorPrice !== null && collection.floorPrice > 0;
  const hasValue = collection.estimatedValueETH !== null && collection.estimatedValueETH > 0;

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-8 text-center">
          <span className="text-lg font-bold text-gray-400">#{rank}</span>
        </div>

        {/* Image */}
        {collection.image ? (
          <img
            src={collection.image}
            alt={collection.name}
            className="w-14 h-14 rounded-lg object-cover border-2 border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56?text=NFT';
            }}
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-2xl">
            🖼️
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate">{collection.name}</h4>
          <p className="text-sm text-gray-500">{collection.symbol} • {collection.tokenType}</p>
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
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-purple-600">{collection.count}</div>
          <div className="text-xs text-gray-500 mb-1">NFTs</div>
          {hasFloorPrice && (
            <div className="text-xs text-gray-600">Floor: {collection.floorPrice.toFixed(4)} ETH</div>
          )}
          {hasValue && (
            <div className="text-sm font-semibold text-green-600">≈ {collection.estimatedValueETH.toFixed(2)} ETH</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalyzer;
