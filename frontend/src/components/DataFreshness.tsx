// DataFreshness - Component showing data source and freshness indicator

import React from 'react';
import '../styles/DataFreshness.css';

interface DataFreshnessProps {
  dataSource?: 'blockchain' | 'cache' | 'error';
  lastUpdated?: string; // ISO timestamp
  compact?: boolean;
}

const DataFreshness: React.FC<DataFreshnessProps> = ({
  dataSource = 'blockchain',
  lastUpdated,
  compact = false,
}) => {
  const getTimeSince = (timestamp: string): string => {
    const now = new Date().getTime();
    const updated = new Date(timestamp).getTime();
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'just now';
  };

  const getBadgeClass = (): string => {
    if (dataSource === 'error') return 'data-freshness error';
    if (dataSource === 'cache') return 'data-freshness cache';
    return 'data-freshness fresh';
  };

  const getBadgeText = (): string => {
    if (dataSource === 'error') return '⚠️ Data unavailable';

    if (!lastUpdated) {
      return dataSource === 'cache' ? '⏳ Cached data' : '✓ Live data';
    }

    const timeSince = getTimeSince(lastUpdated);

    if (compact) {
      return dataSource === 'cache' ? `⏳ ${timeSince}` : `✓ ${timeSince}`;
    }

    return dataSource === 'cache'
      ? `⏳ Cached data (${timeSince})`
      : `✓ Updated ${timeSince}`;
  };

  return (
    <div className={getBadgeClass()}>
      <span className="data-freshness-text">{getBadgeText()}</span>
    </div>
  );
};

export default DataFreshness;
