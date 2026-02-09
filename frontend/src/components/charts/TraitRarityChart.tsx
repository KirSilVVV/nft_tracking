import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { Spinner } from '../loading';

interface TraitCount {
  traitType: string;
  value: string;
  count: number;
  percentage: number;
}

interface TraitAnalysis {
  totalNFTs: number;
  topTraits: TraitCount[];
  traitTypes: string[];
  lastUpdated: string;
}

const TraitRarityChart: React.FC = () => {
  const [data, setData] = useState<TraitAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTraitData();
  }, []);

  const fetchTraitData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:6252/api/traits/analysis');
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch trait analysis:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const trait = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{trait.traitType}</p>
          <p className="text-sm text-blue-600 font-bold">{trait.value}</p>
          <p className="text-sm text-gray-600 mt-1">
            Count: <span className="font-bold">{trait.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Rarity: <span className="font-bold">{trait.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (percentage: number) => {
    if (percentage < 5) return '#EF4444'; // Red - very rare
    if (percentage < 10) return '#F59E0B'; // Orange - rare
    if (percentage < 20) return '#EAB308'; // Yellow - uncommon
    if (percentage < 40) return '#3B82F6'; // Blue - common
    return '#6B7280'; // Gray - very common
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner variant="ring" size="lg" />
      </div>
    );
  }

  if (!data || data.topTraits.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <p>No trait data available</p>
      </div>
    );
  }

  // Prepare chart data with shortened labels
  const chartData = data.topTraits.slice(0, 15).map((trait) => ({
    ...trait,
    label: `${trait.traitType}: ${trait.value}`.length > 25
      ? `${trait.traitType}: ${trait.value}`.substring(0, 22) + '...'
      : `${trait.traitType}: ${trait.value}`,
  }));

  return (
    <div className="w-full">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">NFTs Analyzed</p>
          <p className="text-2xl font-bold text-purple-600">{data.totalNFTs}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Trait Types</p>
          <p className="text-2xl font-bold text-blue-600">{data.traitTypes.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Top Traits</p>
          <p className="text-2xl font-bold text-green-600">{data.topTraits.length}</p>
        </div>
      </div>

      {/* Rarity Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }}></div>
          <span>Very Rare (&lt;5%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
          <span>Rare (5-10%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EAB308' }}></div>
          <span>Uncommon (10-20%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
          <span>Common (20-40%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6B7280' }}></div>
          <span>Very Common (&gt;40%)</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar
              dataKey="percentage"
              name="Rarity %"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
};

export default TraitRarityChart;
