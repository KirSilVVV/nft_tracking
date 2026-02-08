import React, { useState } from 'react';

interface FilterOptions {
  sortBy: 'nftCount' | 'value' | 'balance' | 'percentage';
  minNFTs: number;
  maxNFTs: number;
  hasENS: boolean;
}

interface WhaleFiltersProps {
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  currentFilters: FilterOptions;
}

const WhaleFilters: React.FC<WhaleFiltersProps> = ({
  onFilterChange,
  currentFilters,
}) => {
  const [expandedSort, setExpandedSort] = useState(false);

  const sortOptions = [
    {
      value: 'nftCount' as const,
      label: 'NFT Count',
      icon: '📊',
      description: 'Largest collections first',
    },
    {
      value: 'value' as const,
      label: 'Portfolio Value',
      icon: '💰',
      description: 'Highest value first',
    },
    {
      value: 'balance' as const,
      label: 'ETH Balance',
      icon: '⚡',
      description: 'Most liquid first',
    },
    {
      value: 'percentage' as const,
      label: '% of Collection',
      icon: '🎯',
      description: 'Largest % holders',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-4">
      {/* Sort By */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          📈 Sort By
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onFilterChange({ sortBy: option.value });
                setExpandedSort(false);
              }}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                currentFilters.sortBy === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-medium text-gray-900">
                {option.icon} {option.label}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* NFT Count Range Filter */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          🎨 NFT Count Range
        </label>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="text-xs text-gray-600 block mb-1">Min</label>
            <input
              type="number"
              min="1"
              max="100"
              value={currentFilters.minNFTs}
              onChange={(e) =>
                onFilterChange({ minNFTs: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Min NFTs"
            />
          </div>

          <div className="text-gray-500 text-xl">→</div>

          <div className="flex-1">
            <label className="text-xs text-gray-600 block mb-1">Max</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={currentFilters.maxNFTs}
              onChange={(e) =>
                onFilterChange({ maxNFTs: parseInt(e.target.value) || 1000 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Max NFTs"
            />
          </div>
        </div>

        {/* Range Slider */}
        <div className="mt-3">
          <input
            type="range"
            min="1"
            max="100"
            value={currentFilters.minNFTs}
            onChange={(e) =>
              onFilterChange({ minNFTs: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 NFT</span>
            <span>100 NFTs</span>
          </div>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          ⚡ Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange({ minNFTs: 1, maxNFTs: 5 })}
            className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-50 text-green-700 rounded-lg hover:from-green-200 hover:to-green-100 transition-colors font-medium text-sm border border-green-200"
          >
            🟢 Retail Holders
          </button>

          <button
            onClick={() => onFilterChange({ minNFTs: 5, maxNFTs: 20 })}
            className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-100 transition-colors font-medium text-sm border border-blue-200"
          >
            🔵 Collectors
          </button>

          <button
            onClick={() => onFilterChange({ minNFTs: 20, maxNFTs: 50 })}
            className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 rounded-lg hover:from-purple-200 hover:to-purple-100 transition-colors font-medium text-sm border border-purple-200"
          >
            🟣 Serious Collectors
          </button>

          <button
            onClick={() => onFilterChange({ minNFTs: 50, maxNFTs: 1000 })}
            className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-50 text-red-700 rounded-lg hover:from-red-200 hover:to-red-100 transition-colors font-medium text-sm border border-red-200"
          >
            🐋 Whales (50+)
          </button>

          <button
            onClick={() => onFilterChange({ hasENS: !currentFilters.hasENS })}
            className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm border ${
              currentFilters.hasENS
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
            }`}
          >
            ✓ Has ENS
          </button>
        </div>
      </div>

      {/* Reset Filters */}
      <div className="pt-3 border-t border-gray-200">
        <button
          onClick={() =>
            onFilterChange({
              sortBy: 'nftCount',
              minNFTs: 1,
              maxNFTs: 1000,
              hasENS: false,
            })
          }
          className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          ↺ Reset All Filters
        </button>
      </div>
    </div>
  );
};

export default WhaleFilters;
