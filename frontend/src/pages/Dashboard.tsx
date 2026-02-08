import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RecentTransactions from '../components/RecentTransactions';
import HolderDistributionPieChart from '../components/charts/HolderDistributionPieChart';
import ActivityTrendChart from '../components/charts/ActivityTrendChart';
import TopHoldersBarChart from '../components/charts/TopHoldersBarChart';
import HistoricalTrendChart from '../components/charts/HistoricalTrendChart';
import TraitRarityChart from '../components/charts/TraitRarityChart';
import { DashboardGridSkeleton, ChartSkeleton } from '../components/loading';

interface Distribution {
  totalHolders: number;
  single: number;
  small: number;
  medium: number;
  large: number;
  whales: number;
}

interface Metrics {
  transactionCount: number;
  volume: number;
  avgPrice: number;
  uniqueBuyers: number;
  uniqueSellers: number;
}

const Dashboard: React.FC = () => {
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load data in parallel, non-blocking
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Don't block UI - load in background
      setLoading(true);

      // Load both in parallel
      const [analyticsRes, metricsRes] = await Promise.all([
        axios.get('http://localhost:6252/api/whales/analytics').catch(e => ({ data: null })),
        axios.get('http://localhost:6252/api/metrics?period=24h').catch(e => ({ data: null })),
      ]);

      if (analyticsRes.data) {
        const analyticsData = analyticsRes.data;
        const distribution: Distribution = {
          totalHolders: analyticsData.totalHolders || 0,
          single: analyticsData.distribution?.single || 0,
          small: analyticsData.distribution?.small || 0,
          medium: analyticsData.distribution?.medium || 0,
          large: analyticsData.distribution?.large || 0,
          whales: analyticsData.distribution?.whales || 0,
        };
        setDistribution(distribution);
      }

      if (metricsRes.data) {
        const metricsData = metricsRes.data;
        const metrics: Metrics = {
          transactionCount: metricsData.metrics.transactionCount,
          volume: metricsData.metrics.volume,
          avgPrice: metricsData.metrics.avgPrice,
          uniqueBuyers: metricsData.metrics.uniqueBuyers,
          uniqueSellers: metricsData.metrics.uniqueSellers,
        };
        setMetrics(metrics);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Don't block UI while loading - show page immediately with skeleton states
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time analytics for MAYC NFT collection
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Key Metrics Grid */}
        {!distribution && !metrics ? (
          <DashboardGridSkeleton count={5} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <MetricCard
              icon="🏆"
              title="Total Holders"
              value={distribution?.totalHolders.toLocaleString() || '0'}
              subtitle="addresses"
              color="from-blue-500 to-blue-600"
            />

            <MetricCard
              icon="🐋"
              title="Whales"
              value={distribution?.whales || 0}
              subtitle="20+ NFTs"
              color="from-purple-500 to-purple-600"
            />

            <MetricCard
              icon="📈"
              title="24h Transfers"
              value={metrics?.transactionCount || 0}
              subtitle="transactions"
              color="from-green-500 to-green-600"
            />

            <MetricCard
              icon="💰"
              title="Avg Price"
              value={`${metrics?.avgPrice?.toFixed(2) || '0.00'} ETH`}
              subtitle="per NFT"
              color="from-yellow-500 to-yellow-600"
            />

            <MetricCard
              icon="📊"
              title="Total Volume"
              value={`${metrics?.volume?.toFixed(2) || '0.00'} ETH`}
              subtitle="24 hours"
              color="from-red-500 to-red-600"
            />
          </div>
        )}

        {/* Interactive Charts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📈 Visual Analytics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pie Chart - Holder Distribution */}
            {!distribution ? (
              <ChartSkeleton />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  🥧 Holder Distribution Breakdown
                </h3>
                <HolderDistributionPieChart distribution={distribution} />
              </div>
            )}

            {/* Bar Chart - Top 10 Holders */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                🏆 Top 10 Whale Holders
              </h3>
              <TopHoldersBarChart />
            </div>
          </div>

          {/* Line Chart - Activity Trend (full width) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📊 24-Hour Activity Trend
            </h3>
            <ActivityTrendChart />
          </div>
        </div>

        {/* Collection Insights Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Collection Insights
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical Trends - 7 Day Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📈 Historical Trends (7 Days)
              </h3>
              <HistoricalTrendChart defaultDays={7} />
            </div>

            {/* Trait Rarity Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                🎨 Trait Rarity Analysis
              </h3>
              <TraitRarityChart />
            </div>
          </div>
        </div>

        {/* Distribution Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Holder Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📊 Holder Distribution (Bars)
            </h2>

            <div className="space-y-4">
              <DistributionBar
                label="Single (1 NFT)"
                value={distribution?.single || 0}
                total={distribution?.totalHolders || 1}
                color="bg-blue-500"
              />
              <DistributionBar
                label="Small (2-5 NFTs)"
                value={distribution?.small || 0}
                total={distribution?.totalHolders || 1}
                color="bg-green-500"
              />
              <DistributionBar
                label="Medium (6-10 NFTs)"
                value={distribution?.medium || 0}
                total={distribution?.totalHolders || 1}
                color="bg-yellow-500"
              />
              <DistributionBar
                label="Large (11-20 NFTs)"
                value={distribution?.large || 0}
                total={distribution?.totalHolders || 1}
                color="bg-orange-500"
              />
              <DistributionBar
                label="Whales (20+ NFTs) 🐋"
                value={distribution?.whales || 0}
                total={distribution?.totalHolders || 1}
                color="bg-red-500"
              />
            </div>

            {/* Statistics */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Avg per Holder</p>
                  <p className="text-lg font-bold text-gray-900">
                    {distribution
                      ? (19423 / distribution.totalHolders).toFixed(2)
                      : '0'}
                    NFTs
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Supply</p>
                  <p className="text-lg font-bold text-gray-900">19,423 MAYC</p>
                </div>
              </div>
            </div>
          </div>

          {/* Concentration Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              🎯 Concentration Analysis
            </h2>

            <div className="space-y-6">
              {/* Large & Whale Holders */}
              <ConcentrationCard
                title="Large + Whale Holders"
                percentage={
                  distribution
                    ? // % of total holders that are large or whale
                      (((distribution.large + distribution.whales) / distribution.totalHolders) * 100)
                    : 0
                }
                description="% of all holders with 11+ NFTs"
              />

              {/* Medium Holders */}
              <ConcentrationCard
                title="Medium Holders (6-10)"
                percentage={
                  distribution
                    ? // % of total holders that are medium
                      ((distribution.medium / distribution.totalHolders) * 100)
                    : 0
                }
                description="% of all holders with 6-10 NFTs"
              />

              {/* Retail Holders */}
              <ConcentrationCard
                title="Retail Holders (1-5)"
                percentage={
                  distribution
                    ? // % of retail = Single + Small
                      (((distribution.single + distribution.small) / distribution.totalHolders) * 100)
                    : 0
                }
                description="% of all holders with 1-5 NFTs"
              />
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>💡 Insight:</strong> The concentration shows how evenly
                NFTs are distributed across holders.
              </p>
            </div>
          </div>
        </div>

        {/* Market Statistics Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📈 Market Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatItem
              label="Total Supply"
              value="19,423"
              icon="📦"
              change="+0%"
            />
            <StatItem
              label="Unique Holders"
              value={distribution?.totalHolders.toLocaleString() || '0'}
              icon="👥"
              change={`${((distribution?.whales || 0) / (distribution?.totalHolders || 1) * 100).toFixed(1)}% whales`}
            />
            <StatItem
              label="Unique Buyers (24h)"
              value={metrics?.uniqueBuyers || 0}
              icon="🟢"
              change="active"
            />
            <StatItem
              label="Unique Sellers (24h)"
              value={metrics?.uniqueSellers || 0}
              icon="🔴"
              change="active"
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mb-8">
          <RecentTransactions />
        </div>

        {/* Refresh Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}> = ({ icon, title, value, subtitle, color }) => (
  <div
    className={`
      bg-gradient-to-br ${color} text-white rounded-xl p-6
      shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105
    `}
  >
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-sm opacity-90 mb-1">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs opacity-75 mt-1">{subtitle}</p>
  </div>
);

const DistributionBar: React.FC<{
  label: string;
  value: number;
  total: number;
  color: string;
}> = ({ label, value, total, color }) => {
  const percentage = (value / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-gray-900">
          {value.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const ConcentrationCard: React.FC<{
  title: string;
  percentage: number;
  description: string;
}> = ({ title, percentage, description }) => (
  <div>
    <div className="flex items-end justify-between mb-2">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <span className="text-2xl font-bold text-blue-600">
        {percentage.toFixed(1)}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
        style={{ width: `${Math.min(percentage, 100)}%` }}
      ></div>
    </div>
    <p className="text-xs text-gray-600">{description}</p>
  </div>
);

const StatItem: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  change: string;
}> = ({ label, value, icon, change }) => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm text-gray-600">{label}</p>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{change}</p>
  </div>
);

export default Dashboard;
