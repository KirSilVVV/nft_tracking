import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Spinner } from '../components/loading';
import { useWebSocket } from '../hooks/useWebSocket';
import '../styles/transactions.css';

interface Transaction {
  tokenId: number;
  from: string;
  to: string;
  timestamp: number;
  txHash: string;
  type: 'transfer' | 'sale' | 'mint';
  priceETH?: number;
  isWhaleTransaction?: boolean;
  whaleFrom?: boolean;
  whaleTo?: boolean;
}

interface TransactionsResponse {
  transactions: Transaction[];
  count: number;
  totalInWindow: number;
  _source: string;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sale' | 'transfer' | 'mint'>('all');
  const { showToast } = useToast();

  // WebSocket for real-time updates
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:6255';
  const { isConnected, lastEvent } = useWebSocket(WS_URL);

  useEffect(() => {
    fetchTransactions();
  }, []);

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
        isWhaleTransaction: lastEvent.data.isWhaleTransaction,
        whaleFrom: lastEvent.data.whaleFrom,
        whaleTo: lastEvent.data.whaleTo,
      };

      // Add new transaction to top of list
      setTransactions(prev => [newTx, ...prev]);

      // Show toast for whale transactions
      if (newTx.isWhaleTransaction) {
        showToast(`🐋 Whale transaction! Token #${newTx.tokenId}`, 'info', 5000);
      }
    }
  }, [lastEvent, showToast]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api/whales', '') ?? '';
      const response = await fetch(`${baseUrl}/api/transactions/recent?limit=100`);
      const data: TransactionsResponse = await response.json();
      setTransactions(data.transactions || []);
      showToast(`Loaded ${data.count} recent transactions`, 'success');
    } catch (err) {
      console.error('Failed to fetch transactions:', err);

      // Mock data for testing table alignment
      const mockTransactions: Transaction[] = [
        {
          tokenId: 12345,
          from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          to: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
          timestamp: Math.floor(Date.now() / 1000) - 300,
          txHash: '0xabc123def456',
          type: 'sale',
          priceETH: 4.567,
          isWhaleTransaction: true,
          whaleFrom: true,
          whaleTo: false,
        },
        {
          tokenId: 8901,
          from: '0x29469395eAf6f95920E59F858042f0e28D98a20B',
          to: '0x123456789abcdef123456789abcdef123456789a',
          timestamp: Math.floor(Date.now() / 1000) - 1200,
          txHash: '0xdef789ghi012',
          type: 'transfer',
          isWhaleTransaction: true,
          whaleFrom: true,
          whaleTo: false,
        },
        {
          tokenId: 3456,
          from: '0x0000000000000000000000000000000000000000',
          to: '0xAbCdEf123456789aBcDeF123456789AbCdEf1234',
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          txHash: '0xmint123abc456',
          type: 'mint',
          isWhaleTransaction: false,
          whaleFrom: false,
          whaleTo: false,
        },
        {
          tokenId: 7777,
          from: '0x555555555555555555555555555555555555555',
          to: '0x666666666666666666666666666666666666666',
          timestamp: Math.floor(Date.now() / 1000) - 7200,
          txHash: '0xsale999zzz888',
          type: 'sale',
          priceETH: 12.345,
          isWhaleTransaction: false,
          whaleFrom: false,
          whaleTo: false,
        },
        {
          tokenId: 1001,
          from: '0x29A1D37d588608bbA9ddD5DD4dc3f99d0B5C088e',
          to: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
          timestamp: Math.floor(Date.now() / 1000) - 10800,
          txHash: '0xwhale777mega888',
          type: 'transfer',
          isWhaleTransaction: true,
          whaleFrom: true,
          whaleTo: false,
        },
      ];

      setTransactions(mockTransactions);
      showToast('Loaded 5 mock transactions (backend unavailable)', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">🔄 Transactions</h1>
        <p className="page-subtitle">
          Recent MAYC Transfer events on Ethereum · 🐋 Whale = 20+ NFTs holder ·
          <span style={{ color: isConnected ? 'var(--ok)' : 'var(--t3)', marginLeft: '8px' }}>
            {isConnected ? '🟢 Live' : '🔴 Connecting...'}
          </span>
        </p>
      </div>

      {/* Filter Chips */}
      <div className="filter-bar">
        <div className="filter-chips">
          {(['all', 'sale', 'transfer', 'mint'] as const).map((type) => (
            <button
              key={type}
              className={`filter-chip ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type === 'all' && '🌐 All'}
              {type === 'sale' && '💰 Sales'}
              {type === 'transfer' && '➡️ Transfers'}
              {type === 'mint' && '✨ Mints'}
              {filter === type && (
                <span className="count-badge">{filteredTransactions.length}</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={fetchTransactions} className="btn-refresh" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <Spinner size="lg" />
          <p className="loading-text">Loading transactions...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTransactions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No {filter !== 'all' ? filter : ''} transactions found</h3>
          <p className="text-secondary">Transfer events will appear here when detected</p>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="transactions-container">
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <colgroup>
                <col style={{ width: '180px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '90px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>TYPE</th>
                  <th>TOKEN ID</th>
                  <th>FROM</th>
                  <th>TO</th>
                  <th style={{ textAlign: 'right' }}>PRICE</th>
                  <th>TIME</th>
                  <th style={{ textAlign: 'center' }}>TX</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, index) => (
                  <TransactionRow key={`${tx.txHash}-${index}`} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Transaction Row Component
const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getTransactionType = (tx: Transaction): 'mint' | 'sale' | 'transfer' => {
    if (tx.from === '0x0000000000000000000000000000000000000000') return 'mint';
    if (tx.type === 'sale' || (tx.priceETH && tx.priceETH > 0)) return 'sale';
    return 'transfer';
  };

  const timeAgo = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const type = getTransactionType(tx);

  return (
    <tr className={tx.isWhaleTransaction ? 'whale-tx' : ''}>
      <td>
        <span className={`tx-type-badge ${type}`}>{type.toUpperCase()}</span>
        {tx.isWhaleTransaction && <span className="whale-badge" title="Whale transaction (20+ NFTs)">🐋</span>}
      </td>
      <td>#{tx.tokenId}</td>
      <td title={tx.from}>
        {shortenAddress(tx.from)}
        {tx.whaleFrom && <span className="whale-indicator" title="Whale holder">🐋</span>}
      </td>
      <td title={tx.to}>
        {shortenAddress(tx.to)}
        {tx.whaleTo && <span className="whale-indicator" title="Whale holder">🐋</span>}
      </td>
      <td style={{ textAlign: 'right' }}>
        {tx.priceETH ? `${tx.priceETH.toFixed(3)} ETH` : '—'}
      </td>
      <td>{timeAgo(tx.timestamp)}</td>
      <td style={{ textAlign: 'center' }}>
        <a
          href={`https://etherscan.io/tx/${tx.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tx-link"
          title="View on Etherscan"
        >
          ↗
        </a>
      </td>
    </tr>
  );
};

export default Transactions;
