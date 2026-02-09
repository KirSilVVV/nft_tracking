import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Spinner } from '../loading';

interface DailyMetric {
  date: string;
  transfers: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  volumeETH: number;
  floorPriceETH: number | null;
}

interface HistoricalData {
  period: string;
  dailyBreakdown: DailyMetric[];
  summary: {
    totalTransfers: number;
    avgTransfersPerDay: string;
    weekOverWeekChange: number;
  };
}

interface HistoricalTrendChartProps {
  defaultDays?: number;
}

const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({ defaultDays = 7 }) => {
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30>(defaultDays as 7 | 30);

  useEffect(() => {
    fetchHistoricalData();
  }, [selectedPeriod]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:6252/api/metrics/historical?days=${selectedPeriod}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.date}</p>
          <p className="text-sm text-blue-600">
            Transfers: <span className="font-bold">{data.transfers}</span>
          </p>
          <p className="text-sm text-green-600">
            Buyers: <span className="font-bold">{data.uniqueBuyers}</span>
          </p>
          <p className="text-sm text-red-600">
            Sellers: <span className="font-bold">{data.uniqueSellers}</span>
          </p>
          <p className="text-sm text-purple-600">
            Volume: <span className="font-bold">{data.volumeETH.toFixed(2)} ETH</span>
          </p>
          {data.floorPriceETH && (
            <p className="text-sm text-orange-600">
              Floor: <span className="font-bold">{data.floorPriceETH.toFixed(4)} ETH</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner variant="ring" size="lg" />
      </div>
    );
  }

  if (!data || data.dailyBreakdown.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <p>No historical data available</p>
      </div>
    );
  }

  // Calculate floor price trend
  const floorPrices = data.dailyBreakdown
    .filter((d) => d.floorPriceETH !== null)
    .map((d) => d.floorPriceETH as number);
  const firstFloor = floorPrices[0];
  const lastFloor = floorPrices[floorPrices.length - 1];
  const floorChange = firstFloor && lastFloor
    ? ((lastFloor - firstFloor) / firstFloor * 100).toFixed(1)
    : null;

  return (
    <div className="w-full">
      {/* Period Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            onClick={() => setSelectedPeriod(7)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 7
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod(30)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 30
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Total Transfers</p>
          <p className="text-2xl font-bold text-blue-600">{data.summary.totalTransfers}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Avg Per Day</p>
          <p className="text-2xl font-bold text-green-600">{data.summary.avgTransfersPerDay}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Week/Week Change</p>
          <p className={`text-2xl font-bold ${data.summary.weekOverWeekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.summary.weekOverWeekChange > 0 ? '+' : ''}{data.summary.weekOverWeekChange}%
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Floor Price Trend</p>
          {floorChange !== null ? (
            <p className={`text-2xl font-bold ${parseFloat(floorChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(floorChange) > 0 ? '+' : ''}{floorChange}%
            </p>
          ) : (
            <p className="text-lg text-gray-400">N/A</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.dailyBreakdown} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Line
              type="monotone"
              dataKey="transfers"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Transfers"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="uniqueBuyers"
              stroke="#10B981"
              strokeWidth={2}
              name="Buyers"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="uniqueSellers"
              stroke="#EF4444"
              strokeWidth={2}
              name="Sellers"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="floorPriceETH"
              stroke="#F97316"
              strokeWidth={2}
              name="Floor Price (ETH)"
              dot={{ r: 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoricalTrendChart;
