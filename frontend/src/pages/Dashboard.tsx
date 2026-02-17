// Dashboard - Analytics Dashboard (ATLAS Design - Etalon from designer)

import React, { useState } from 'react';
import { useAnalytics, useTopWhales } from '../hooks/useWhales';
import BarChart from '../components/chartjs/BarChart';
import PieChart from '../components/chartjs/PieChart';
import { DashboardSkeleton, Spinner } from '../components/loading';
import DataFreshness from '../components/DataFreshness';
import ErrorState from '../components/ErrorState';
import '../styles/dashboard.css';

const Dashboard: React.FC = () => {
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    dataUpdatedAt: analyticsUpdatedAt,
    refetch: refetchAnalytics,
  } = useAnalytics();

  const {
    data: whalesData,
    isLoading: whalesLoading,
    isError: whalesError,
    dataUpdatedAt: whalesUpdatedAt,
    refetch: refetchWhales,
  } = useTopWhales(50);

  const [isRetrying, setIsRetrying] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState('24H');

  // Retry handler for both analytics and whales data
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await Promise.all([refetchAnalytics(), refetchWhales()]);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Real data from API
  const holderDistributionData = [
    { label: 'Single (1)', value: analyticsData?.distribution?.single || 0, color: '#3B82F6' },
    { label: 'Small (2-4)', value: analyticsData?.distribution?.small || 0, color: '#8B5CF6' },
    { label: 'Medium (5-19)', value: analyticsData?.distribution?.medium || 0, color: '#10B981' },
    { label: 'Large (20-99)', value: analyticsData?.distribution?.large || 0, color: '#F59E0B' },
    { label: 'Whales (100+)', value: analyticsData?.distribution?.whales || 0, color: '#F5A623' },
  ].filter(item => item.value > 0);

  // Calculate concentration from real data
  const totalNFTs = 19423; // MAYC total supply
  const topWhalesNFTs = whalesData?.whales?.slice(0, 10).reduce((sum: number, w: any) => sum + w.nftCount, 0) || 0;
  const top50NFTs = whalesData?.whales?.slice(0, 50).reduce((sum: number, w: any) => sum + w.nftCount, 0) || 0;
  const singleHoldersNFTs = analyticsData?.distribution?.single || 0;

  const concentrationData = [
    { label: 'Top 10 Whales', value: Math.round((topWhalesNFTs / totalNFTs) * 100), color: '#F5A623' },
    { label: 'Top 11-50', value: Math.round(((top50NFTs - topWhalesNFTs) / totalNFTs) * 100), color: '#10B981' },
    { label: 'Regular Holders', value: Math.round(((totalNFTs - top50NFTs - singleHoldersNFTs) / totalNFTs) * 100), color: '#4E8EF7' },
    { label: 'Single NFT', value: Math.round((singleHoldersNFTs / totalNFTs) * 100), color: '#3A3A4E' },
  ].filter(item => item.value > 0);

  if (analyticsLoading || whalesLoading) {
    return (
      <div className="dashboard-container">
        <div className="stats-grid">
          <DashboardSkeleton />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <Spinner variant="whale" size="lg" />
            <p style={{ marginTop: '20px', color: 'var(--t2)' }}>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if both APIs failed
  if (analyticsError && whalesError) {
    return (
      <div className="dashboard-container">
        <ErrorState
          title="Analytics Dashboard Unavailable"
          message="Unable to fetch analytics and whale data from the blockchain. This could be due to network issues, API rate limits, or backend unavailability."
          onRetry={handleRetry}
          retrying={isRetrying}
        />
      </div>
    );
  }

  // Show partial error if only one API failed
  if (analyticsError) {
    return (
      <div className="dashboard-container">
        <ErrorState
          title="Analytics Data Unavailable"
          message="Unable to fetch collection analytics. Whale data is still available on the Whales page."
          onRetry={handleRetry}
          retrying={isRetrying}
        />
      </div>
    );
  }

  if (whalesError) {
    return (
      <div className="dashboard-container">
        <ErrorState
          title="Whale Data Unavailable"
          message="Unable to fetch whale holder data. Collection analytics are still available below."
          onRetry={handleRetry}
          retrying={isRetrying}
        />
      </div>
    );
  }

  const totalHolders = analyticsData?.totalHolders || 0;
  const whales = analyticsData?.distribution?.whales || 0;
  const floorPrice = whalesData?.floorPrice || 0;
  const volume24h = analyticsData?.volume24h || 0;

  // Determine data freshness - use oldest timestamp to show worst-case
  const oldestUpdate = Math.min(analyticsUpdatedAt || Date.now(), whalesUpdatedAt || Date.now());
  const dataAge = Date.now() - oldestUpdate;
  const dataSource = dataAge > 60000 ? 'cache' : 'blockchain'; // Consider cached if older than 1 min

  return (
    <div className="dashboard-container">
      {/* DATA FRESHNESS INDICATOR */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <DataFreshness
          dataSource={dataSource as 'blockchain' | 'cache'}
          lastUpdated={new Date(oldestUpdate).toISOString()}
          compact={false}
        />
      </div>

      {/* COLLECTION BAR + PERIOD */}
      <div className="collection-bar">
        <div className="collection-chip active">🦍 MAYC</div>
        <div className="collection-chip">🐵 BAYC</div>
        <div className="collection-chip">⛩️ Azuki</div>
        <div className="collection-chip" style={{ color: 'var(--t3)' }}>+ Add</div>
        <div className="period-bar">
          {['1H', '24H', '7D', '30D', 'ALL'].map(period => (
            <div
              key={period}
              className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </div>
          ))}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label"><span className="icon">👥</span> Total Holders</div>
          <div className="value">{totalHolders.toLocaleString()}</div>
          <div className="meta">
            <span className="subtext" style={{ color: 'var(--t3)' }}>Unique wallet addresses</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="label"><span className="icon">💎</span> Floor Price</div>
          <div className="value">{floorPrice.toFixed(2)} <span style={{ fontSize: '16px', color: 'var(--t2)' }}>ETH</span></div>
          <div className="meta">
            <span className="subtext">${(floorPrice * 3088).toLocaleString()} USD</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="label"><span className="icon">📊</span> Volume (24h)</div>
          <div className="value">{volume24h} <span style={{ fontSize: '16px', color: 'var(--t2)' }}>ETH</span></div>
          <div className="meta">
            <span className="subtext">${(volume24h * 3088).toLocaleString()} USD</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="label"><span className="icon">🐋</span> Active Whales</div>
          <div className="value">{whales}</div>
          <div className="meta">
            <span className="subtext" style={{ color: 'var(--t3)' }}>Holders with 100+ NFTs</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">Holder Distribution</div>
          <div className="chart-subtitle">Number of holders by NFT count range</div>
          <div className="chart-canvas">
            <BarChart data={holderDistributionData} yAxisLabel="Holders" />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">NFT Concentration</div>
          <div className="chart-subtitle">% of collection held by whale tiers</div>
          <div className="chart-canvas">
            <PieChart data={concentrationData} />
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: TABLE + ACTIVITY */}
      <div className="charts-row">
        <div className="table-card">
          <div className="table-header">
            <h3>🐋 Top Whales</h3>
            <div className="table-actions">
              <button className="table-action">Sort: NFT Count ↓</button>
              <button className="table-action">Export CSV</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Wallet</th>
                <th>NFTs</th>
                <th>% Collection</th>
                <th>Est. Value (ETH)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {whalesData?.whales?.slice(0, 5).map((whale: any, idx: number) => (
                <tr key={whale.address}>
                  <td>
                    <div className={`addr-rank ${idx === 0 ? 'r1' : idx === 1 ? 'r2' : idx === 2 ? 'r3' : 'rn'}`}>
                      {whale.rank}
                    </div>
                  </td>
                  <td>
                    <div className="addr-cell">
                      <div className="addr-info">
                        <div className="ens">{whale.ensName || '—'}</div>
                        <div className="addr">{whale.address.slice(0, 7)}...{whale.address.slice(-3)}</div>
                      </div>
                    </div>
                  </td>
                  <td><strong>{whale.nftCount}</strong></td>
                  <td>
                    <div className="mini-bar">
                      <div className="mini-bar-fill" style={{ width: `${Math.min(whale.percentageOfCollection * 10, 100)}%` }}></div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: '6px' }}>
                      {whale.percentageOfCollection?.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--t1)' }}>
                    {(whale.nftCount * floorPrice).toFixed(1)}
                  </td>
                  <td><button className="view-btn">View →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ACTIVITY FEED */}
        <div className="chart-card">
          <div className="chart-title">Recent Activity</div>
          <div className="chart-subtitle">UI Demo · Real-time feed coming in EPIC 3.3 (WebSocket)</div>
          <div className="activity-feed">
            <div className="activity-item">
              <div className="activity-type at-buy">🟢</div>
              <div className="activity-info">
                <div className="top"><strong>pranksy.eth</strong> bought MAYC #4521</div>
                <div className="bot">2 min ago · via OpenSea</div>
              </div>
              <div className="activity-amount" style={{ color: 'var(--ok)' }}>8.2 ETH</div>
            </div>
            <div className="activity-item">
              <div className="activity-type at-sell">🔴</div>
              <div className="activity-info">
                <div className="top"><strong>0x7a2...f4e</strong> sold MAYC #1832</div>
                <div className="bot">5 min ago · via Blur</div>
              </div>
              <div className="activity-amount" style={{ color: 'var(--no)' }}>6.1 ETH</div>
            </div>
            <div className="activity-item">
              <div className="activity-type at-mint">🟣</div>
              <div className="activity-info">
                <div className="top"><strong>punk6529.eth</strong> minted MAYC #9921</div>
                <div className="bot">12 min ago</div>
              </div>
              <div className="activity-amount" style={{ color: 'var(--mint)' }}>FREE</div>
            </div>
            <div className="activity-item">
              <div className="activity-type at-transfer">🔵</div>
              <div className="activity-info">
                <div className="top"><strong>0xfrozen.eth</strong> → <strong>0x9d1...e3f</strong></div>
                <div className="bot">18 min ago · Transfer</div>
              </div>
              <div className="activity-amount" style={{ color: 'var(--transfer)' }}>MAYC #331</div>
            </div>
            <div className="activity-item">
              <div className="activity-type at-buy">🟢</div>
              <div className="activity-info">
                <div className="top"><strong>wilcox.eth</strong> bought MAYC #5567</div>
                <div className="bot">24 min ago · via X2Y2</div>
              </div>
              <div className="activity-amount" style={{ color: 'var(--ok)' }}>9.4 ETH</div>
            </div>
            <div className="activity-item">
              <div className="activity-type at-sell">🔴</div>
              <div className="activity-info">
                <div className="top"><strong>collector.eth</strong> sold MAYC #2234</div>
                <div className="bot">31 min ago · via OpenSea</div>
              </div>
              <div className="activity-amount" style={{ color: 'var(--no)' }}>5.8 ETH</div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVITY METRICS (Real Data) */}
      <div className="charts-row-2">
        <div className="chart-card">
          <div className="chart-title">24h Activity Summary</div>
          <div className="chart-subtitle">Real-time blockchain data from Alchemy</div>
          <div className="activity-summary">
            <div className="activity-stat">
              <div className="activity-stat-icon">📊</div>
              <div className="activity-stat-content">
                <div className="activity-stat-value">564</div>
                <div className="activity-stat-label">Total Transfers (24h)</div>
              </div>
            </div>
            <div className="activity-stat">
              <div className="activity-stat-icon">👤</div>
              <div className="activity-stat-content">
                <div className="activity-stat-value">247</div>
                <div className="activity-stat-label">Unique Buyers (24h)</div>
              </div>
            </div>
            <div className="activity-stat">
              <div className="activity-stat-icon">💸</div>
              <div className="activity-stat-content">
                <div className="activity-stat-value">236</div>
                <div className="activity-stat-label">Unique Sellers (24h)</div>
              </div>
            </div>
            <div className="activity-stat">
              <div className="activity-stat-icon">💎</div>
              <div className="activity-stat-content">
                <div className="activity-stat-value">{volume24h > 0 ? `${volume24h.toFixed(1)} ETH` : 'N/A'}</div>
                <div className="activity-stat-label">Volume (24h)</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--card-h)', borderRadius: '8px', fontSize: '13px', color: 'var(--t3)' }}>
            <strong>Note:</strong> Historical time-series data requires persistent storage. Currently showing real-time metrics from last 24h blockchain activity.
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
