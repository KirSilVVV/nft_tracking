import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { TransactionListSkeleton, EmptyState, Spinner } from './loading';
import { useWebSocket } from '../hooks/useWebSocket';

interface Transaction {
  tokenId: number;
  from: string;
  to: string;
  timestamp: number;
  txHash?: string;
  type?: 'mint' | 'transfer' | 'sale';
  priceETH?: number;
}

const PAGE_SIZE = 20;

const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalInWindow, setTotalInWindow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [timeFilter, setTimeFilter] = useState(24);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // WebSocket for real-time transaction updates
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:6252/ws';
  const { lastEvent, isConnected } = useWebSocket(WS_URL);

  // Initial fetch when time filter changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    fetchTransactions(true);
  }, [timeFilter]);

  // Listen for new transaction events from WebSocket
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'transaction:new' && lastEvent.data) {
      const newTx: Transaction = {
        tokenId: lastEvent.data.tokenId,
        from: lastEvent.data.from,
        to: lastEvent.data.to,
        timestamp: lastEvent.data.timestamp,
        txHash: lastEvent.data.txHash,
        type: lastEvent.data.type || 'transfer',
        priceETH: lastEvent.data.priceETH,
      };

      // Add new transaction to top of list (prepend)
      setTransactions(prev => [newTx, ...prev]);
      setTotalInWindow(prev => prev + 1);
      console.log('🔄 New transaction received via WebSocket:', newTx);
    }
  }, [lastEvent]);

  const fetchTransactions = async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      // Fetch all transactions in window (up to 500) so we can paginate client-side
      const response = await axios.get(
        `http://localhost:6252/api/transactions/recent?hours=${timeFilter}&limit=500`,
        { timeout: 60000 }
      );
      if (response.data.transactions) {
        setTransactions(response.data.transactions);
        setTotalInWindow(response.data.totalInWindow || response.data.transactions.length);
      } else {
        setTransactions([]);
        setTotalInWindow(0);
      }
    } catch (error) {
      console.error('Failed to fetch transactions from API:', error);
      setTransactions([]);
      setTotalInWindow(0);
    }
    setLoading(false);
  };

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    // Simulate small delay for UX feedback
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, transactions.length));
      setLoadingMore(false);
    }, 200);
  }, [transactions.length]);

  const visibleTransactions = transactions.slice(0, displayCount);
  const hasMore = displayCount < transactions.length;

  const getTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      mint: 'bg-blue-100 text-blue-800',
      transfer: 'bg-gray-100 text-gray-800',
      sale: 'bg-green-100 text-green-800',
    };
    return colors[type || 'transfer'] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type?: string) => {
    const icons: Record<string, string> = {
      mint: '🎨',
      transfer: '↔️',
      sale: '💰',
    };
    return icons[type || 'transfer'] || '📦';
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          {totalInWindow > 0 && (
            <p className="text-sm text-gray-500">
              Showing {visibleTransactions.length} of {totalInWindow} transactions ({timeFilter}h)
            </p>
          )}
        </div>

        {/* Time Filter */}
        <div className="flex space-x-2">
          {[
            { label: '24h', value: 24 },
            { label: '48h', value: 48 },
            { label: '7d', value: 168 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setTimeFilter(item.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === item.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TransactionListSkeleton count={5} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No transactions found"
          message={`No activity in the last ${timeFilter} hours`}
        />
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {visibleTransactions.map((tx, idx) => (
            <div
              key={`${tx.txHash}-${tx.tokenId}-${idx}`}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">{getTypeIcon(tx.type)}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      MAYC #{tx.tokenId}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatAddress(tx.from)} →{' '}
                      <span className="text-blue-600 font-medium">
                        {formatAddress(tx.to)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="text-right ml-4">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                      tx.type
                    )}`}
                  >
                    {tx.type || 'transfer'}
                  </div>
                  {tx.priceETH && (
                    <div className="text-sm font-semibold text-green-600 mt-1">
                      {tx.priceETH.toFixed(2)} ETH
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(tx.timestamp)}
                  </div>
                </div>
              </div>

              {/* Etherscan Link */}
              {tx.txHash && (
                <a
                  href={`https://etherscan.io/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-2 block"
                >
                  View Transaction ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More / Refresh Buttons */}
      <div className="mt-4 space-y-2">
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingMore ? (
              <>
                <Spinner variant="ring" size="sm" />
                Loading...
              </>
            ) : (
              `Load More (${transactions.length - displayCount} remaining)`
            )}
          </button>
        )}
        <button
          onClick={() => fetchTransactions(false)}
          className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default RecentTransactions;
