import React, { useState } from 'react';
import { Whale } from '../types/whale.types';

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

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-slate-300 to-slate-500';
    if (rank === 3) return 'from-orange-300 to-orange-600';
    return 'from-blue-400 to-blue-600';
  };

  const getRankEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🔟';
    return '🐋';
  };

  // Get gradient background for top 3
  const getBackgroundGradient = (): string => {
    if (whale.rank === 1) return 'from-yellow-50 to-yellow-100 border-yellow-200';
    if (whale.rank === 2) return 'from-slate-50 to-slate-100 border-slate-200';
    if (whale.rank === 3) return 'from-orange-50 to-orange-100 border-orange-200';
    return 'from-white to-gray-50 border-gray-200';
  };

  return (
    <div
      className={`
        bg-gradient-to-r ${getBackgroundGradient()} rounded-lg shadow-md p-6
        hover:shadow-xl transition-all duration-300 cursor-pointer
        border-2 ${whale.rank <= 3 ? 'border-solid' : 'border-gray-200'}
      `}
    >
      {/* Header with expand button */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-300">
        <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>#{whale.rank}</span>
          <span>{getRankEmoji(whale.rank)}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-200 rounded"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left side: Rank & Address */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Avatar or Rank Badge */}
          <div className="flex-shrink-0">
            {(whale as any).ensAvatar ? (
              <img
                src={(whale as any).ensAvatar}
                alt={whale.ensName || whale.address}
                className="w-14 h-14 rounded-full object-cover shadow-lg border-2 border-gray-200"
                title={whale.ensName || whale.address}
              />
            ) : (
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center
                text-white font-bold text-lg
                bg-gradient-to-br ${getRankColor(whale.rank)}
                shadow-lg
              `}>
                {getRankEmoji(whale.rank)}
              </div>
            )}
          </div>

          {/* Address & ENS */}
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-gray-900 truncate">
              {whale.ensName || formatAddress(whale.address)}
            </div>
            {whale.ensName && (
              <div className="text-sm text-gray-500 truncate">
                {formatAddress(whale.address)}
              </div>
            )}

            {/* ENS Status */}
            <div className="text-xs text-gray-400 mt-1">
              {whale.ensName ? (
                <span>✓ ENS Verified</span>
              ) : (
                <span>No ENS name</span>
              )}
              {(whale as any).twitter && (
                <span className="ml-2">• Twitter: @{(whale as any).twitter}</span>
              )}
            </div>

            {/* Twitter link if available */}
            {(whale as any).twitter && (
              <a
                href={`https://twitter.com/${(whale as any).twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-600 inline-flex items-center gap-1 mt-1"
                title={`@${(whale as any).twitter}`}
              >
                <span>𝕏</span> @{(whale as any).twitter}
              </a>
            )}

            <a
              href={`https://etherscan.io/address/${whale.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 ml-2"
            >
              Etherscan
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h3.586L9.293 9.293a1 1 0 001.414 1.414L16 6.414V10a1 1 0 102 0V4a1 1 0 00-1-1h-6z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right side: Stats */}
        <div className="text-right flex-shrink-0">
          <div className="text-3xl font-bold text-gray-900 text-nowrap">
            {whale.nftCount}
          </div>
          <div className="text-sm text-gray-600">NFTs</div>
        </div>
      </div>

      {/* Second row: Collection Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-sm text-gray-500">Collection Ownership</div>
          <div className="text-xl font-semibold text-gray-900">
            {whale.percentageOfCollection ? whale.percentageOfCollection.toFixed(2) : '0.00'}%
          </div>
          <div className="text-xs text-gray-500">of MAYC</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Floor Price</div>
          <div className="text-xl font-semibold text-gray-900">
            {whale.floorPrice?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500">ETH</div>
        </div>
      </div>

      {/* Third row: Values */}
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <div className="text-sm text-gray-500">Estimated Value</div>
          <div className="text-xl font-semibold text-gray-900">
            {typeof whale.estimatedValueETH === 'number'
              ? whale.estimatedValueETH.toFixed(2)
              : parseFloat(whale.estimatedValueETH as string).toFixed(2)} ETH
          </div>
          {whale.estimatedValueUSD && (
            <div className="text-xs text-gray-500">
              ≈ ${(whale.estimatedValueUSD).toLocaleString()}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500">ETH Balance</div>
          <div className="text-xl font-semibold text-gray-900">
            {whale.ethBalance !== null && whale.ethBalance !== undefined
              ? typeof whale.ethBalance === 'number'
                ? whale.ethBalance.toFixed(2)
                : parseFloat(whale.ethBalance as string).toFixed(2)
              : '—'}  {/* Show dash if data not available */}
          </div>
          <div className="text-xs text-gray-500">
            {whale.ethBalance ? 'ETH' : 'unavailable'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {onViewActivity && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewActivity(whale.address);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            View Activity
          </button>
        </div>
      )}

      {/* Token IDs (collapsible) */}
      {whale.nftIds && whale.nftIds.length > 0 && isExpanded && (
        <div className="mt-4 p-4 bg-white bg-opacity-70 rounded-lg border border-gray-300 animate-slideDown">
          <h3 className="text-sm text-gray-700 font-semibold mb-3">
            Token IDs ({whale.nftIds.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {whale.nftIds.slice(0, 30).map(id => (
              <button
                key={id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewNft) {
                    onViewNft(id);
                  } else {
                    window.open(`https://etherscan.io/nft/0x60E4d786628Fea6478F785A6d7e704777c86a7c6/${id}`, '_blank');
                  }
                }}
                className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer font-medium"
                title={`View MAYC #${id}`}
              >
                #{id}
              </button>
            ))}
            {whale.nftIds.length > 30 && (
              <span className="text-xs text-gray-500 italic px-2 py-1">
                +{whale.nftIds.length - 30} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhaleCard;
