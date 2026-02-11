import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Spinner } from '../components/loading';
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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';
      const response = await fetch(`${baseUrl}/api/transactions/recent?limit=100`);
      const data: TransactionsResponse = await response.json();
      setTransactions(data.transactions || []);
      showToast(`Loaded ${data.count} recent transactions`, 'success');
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      showToast('Failed to load transactions', 'error');
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
        <p className="page-subtitle">Recent MAYC Transfer events on Ethereum · 🐋 Whale = 20+ NFTs holder</p>
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
          <div className="transactions-table">
            <div className="table-header">
              <span>Type</span>
              <span>Token ID</span>
              <span>From</span>
              <span>To</span>
              <span>Price</span>
              <span>Time</span>
              <span>TX</span>
            </div>
            {filteredTransactions.map((tx, index) => (
              <TransactionRow key={`${tx.txHash}-${index}`} tx={tx} />
            ))}
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
    <div className={`tx-row ${tx.isWhaleTransaction ? 'whale-tx' : ''}`}>
      <div className="tx-cell">
        <span className={`tx-type-badge ${type}`}>{type}</span>
        {tx.isWhaleTransaction && <span className="whale-badge" title="Whale transaction (20+ NFTs)">🐋</span>}
      </div>
      <div className="tx-cell tx-token-id">#{tx.tokenId}</div>
      <div className="tx-cell tx-address" title={tx.from}>
        {shortenAddress(tx.from)}
        {tx.whaleFrom && <span className="whale-indicator" title="Whale holder">🐋</span>}
      </div>
      <div className="tx-cell tx-address" title={tx.to}>
        {shortenAddress(tx.to)}
        {tx.whaleTo && <span className="whale-indicator" title="Whale holder">🐋</span>}
      </div>
      <div className="tx-cell tx-price">
        {tx.priceETH ? `${tx.priceETH.toFixed(3)} ETH` : '—'}
      </div>
      <div className="tx-cell tx-time">{timeAgo(tx.timestamp)}</div>
      <div className="tx-cell tx-link-cell">
        <a
          href={`https://etherscan.io/tx/${tx.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tx-link"
          title="View on Etherscan"
        >
          ↗
        </a>
      </div>
    </div>
  );
};

export default Transactions;
