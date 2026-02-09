// Dashboard - Analytics Dashboard with Chart.js (ATLAS Design)

import React from 'react';
import { useAnalytics, useTopWhales } from '../hooks/useWhales';
import BarChart from '../components/chartjs/BarChart';
import PieChart from '../components/chartjs/PieChart';
import LineChart from '../components/chartjs/LineChart';
import DoughnutChart from '../components/chartjs/DoughnutChart';
import { DashboardSkeleton, Spinner } from '../components/loading';
import '../styles/dashboard.css';

const Dashboard: React.FC = () => {
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  const { data: whalesData, isLoading: whalesLoading } = useTopWhales(10);

  // Mock activity trend data (24 hours by hour)
  const activityTrendData = Array.from({ length: 24 }, (_, i) => ({
    label: `${i}:00`,
    value: Math.floor(Math.random() * 30) + 10,
  }));

  // Prepare data for charts
  const distributionData = analyticsData ? [
    { label: 'Single (1 NFT)', value: analyticsData.distribution?.single || 0, color: '#4E8EF7' },
    { label: 'Small (2-5)', value: analyticsData.distribution?.small || 0, color: '#34D399' },
    { label: 'Medium (6-10)', value: analyticsData.distribution?.medium || 0, color: '#FBBF24' },
    { label: 'Large (11-19)', value: analyticsData.distribution?.large || 0, color: '#FB923C' },
    { label: 'Whales (20+)', value: analyticsData.distribution?.whales || 0, color: '#F5A623' },
  ] : [];

  const topHoldersData = whalesData?.whales?.slice(0, 10).map((whale: any) => ({
    label: whale.ensName || `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`,
    value: whale.nftCount,
  })) || [];

  const concentrationData = analyticsData ? [
    { label: 'Whales', value: analyticsData.distribution?.whales || 0, color: '#F5A623' },
    { label: 'Large', value: analyticsData.distribution?.large || 0, color: '#FB923C' },
    { label: 'Medium', value: analyticsData.distribution?.medium || 0, color: '#FBBF24' },
    { label: 'Small + Single', value: (analyticsData.distribution?.small || 0) + (analyticsData.distribution?.single || 0), color: '#4E8EF7' },
  ] : [];

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

  return (
    <div className="dashboard-container">
      {/* Stat Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Holders</div>
            <div className="stat-value">{analyticsData?.totalHolders?.toLocaleString() || '0'}</div>
            <div className="stat-change">addresses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🐋</div>
          <div className="stat-content">
            <div className="stat-label">Whales (20+)</div>
            <div className="stat-value" style={{ color: 'var(--gold)' }}>
              {analyticsData?.distribution?.whales || 0}
            </div>
            <div className="stat-change">collectors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Floor Price</div>
            <div className="stat-value" style={{ color: 'var(--ok)' }}>
              {whalesData?.floorPrice ? `${whalesData.floorPrice.toFixed(3)}` : '—'}
            </div>
            <div className="stat-change">ETH</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">24h Volume</div>
            <div className="stat-value">{analyticsData?.volume24h || '0.00'}</div>
            <div className="stat-change">ETH</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Bar Chart - Top Holders */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">🏆 Top 10 Holders</h3>
            <p className="chart-subtitle">NFTs held by top whales</p>
          </div>
          <div className="chart-body">
            {topHoldersData.length > 0 ? (
              <BarChart data={topHoldersData} yAxisLabel="NFTs Held" />
            ) : (
              <div className="chart-empty">No data available</div>
            )}
          </div>
        </div>

        {/* Pie Chart - Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">🥧 Holder Distribution</h3>
            <p className="chart-subtitle">Breakdown by wallet size</p>
          </div>
          <div className="chart-body">
            {distributionData.length > 0 ? (
              <PieChart data={distributionData} />
            ) : (
              <div className="chart-empty">No data available</div>
            )}
          </div>
        </div>

        {/* Line Chart - Activity Trend */}
        <div className="chart-card chart-card-wide">
          <div className="chart-header">
            <h3 className="chart-title">📊 24h Activity Trend</h3>
            <p className="chart-subtitle">Transfer events by hour</p>
          </div>
          <div className="chart-body">
            <LineChart data={activityTrendData} yAxisLabel="Transfers" />
          </div>
        </div>

        {/* Doughnut Chart - Concentration */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">🎯 Concentration Analysis</h3>
            <p className="chart-subtitle">NFT distribution pattern</p>
          </div>
          <div className="chart-body">
            {concentrationData.length > 0 ? (
              <DoughnutChart data={concentrationData} centerText={`${analyticsData?.totalHolders || 0}`} />
            ) : (
              <div className="chart-empty">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Whale Table */}
      <div className="whale-table-card">
        <div className="whale-table-header">
          <h3>🐋 Top Whales Overview</h3>
          <button className="btn-ghost" onClick={() => window.location.href = '#/whales'}>
            View All →
          </button>
        </div>
        <div className="whale-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Address / ENS</th>
                <th>NFTs</th>
                <th>Collection %</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {whalesData?.whales?.slice(0, 10).map((whale: any) => (
                <tr key={whale.address}>
                  <td className="rank-cell">
                    <span className={`rank-badge ${whale.rank <= 3 ? `rank-${whale.rank}` : ''}`}>
                      #{whale.rank}
                    </span>
                  </td>
                  <td className="address-cell">
                    {whale.ensName ? (
                      <span className="ens-name">{whale.ensName}</span>
                    ) : (
                      <span className="address">
                        {whale.address.slice(0, 6)}...{whale.address.slice(-4)}
                      </span>
                    )}
                  </td>
                  <td className="count-cell">{whale.nftCount}</td>
                  <td className="percentage-cell">{whale.percentageOfCollection?.toFixed(2)}%</td>
                  <td className="progress-cell">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(whale.percentageOfCollection * 10, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="activity-feed-card">
        <div className="activity-feed-header">
          <h3>⚡ Recent Activity</h3>
          <div className="live-indicator">
            <div className="live-dot"></div>
            Live
          </div>
        </div>
        <div className="activity-feed">
          <div className="activity-item">
            <div className="activity-icon buy">📥</div>
            <div className="activity-content">
              <div className="activity-text">
                <span className="address">0xf4a...dc2</span> bought MAYC #1234
              </div>
              <div className="activity-time">2 minutes ago</div>
            </div>
            <div className="activity-value">0.9 ETH</div>
          </div>

          <div className="activity-item">
            <div className="activity-icon sell">📤</div>
            <div className="activity-content">
              <div className="activity-text">
                <span className="address">0x7c9...4c2</span> sold MAYC #5678
              </div>
              <div className="activity-time">5 minutes ago</div>
            </div>
            <div className="activity-value">0.85 ETH</div>
          </div>

          <div className="activity-item">
            <div className="activity-icon transfer">🔄</div>
            <div className="activity-content">
              <div className="activity-text">
                <span className="address">0xac0...c1c</span> transferred MAYC #9012
              </div>
              <div className="activity-time">12 minutes ago</div>
            </div>
            <div className="activity-value">—</div>
          </div>

          <div className="activity-item">
            <div className="activity-icon buy">📥</div>
            <div className="activity-content">
              <div className="activity-text">
                <span className="address">0x42b...bf</span> bought MAYC #3456
              </div>
              <div className="activity-time">18 minutes ago</div>
            </div>
            <div className="activity-value">0.92 ETH</div>
          </div>
        </div>
      </div>

      {/* AI Insight Bar */}
      <div className="ai-insight-bar">
        <div className="ai-icon">🤖</div>
        <div className="ai-content">
          <div className="ai-title">AI Insight</div>
          <div className="ai-text">
            Whale activity increased by 15% in the last 24 hours. Large holders are accumulating, suggesting bullish sentiment.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
