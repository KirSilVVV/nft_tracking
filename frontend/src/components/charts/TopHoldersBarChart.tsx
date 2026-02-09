import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { Spinner } from '../loading';

interface HolderData {
  address: string;
  shortAddress: string;
  ensName: string | null;
  nftCount: number;
  rank: number;
  estimatedValueETH: number;
}

const TopHoldersBarChart: React.FC = () => {
  const [data, setData] = useState<HolderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopHolders();
  }, []);

  const fetchTopHolders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:6252/api/whales/top?limit=10&skipENS=true');

      const holders: HolderData[] = response.data.whales.map((whale: any) => ({
        address: whale.address,
        shortAddress: `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`,
        ensName: whale.ensName,
        nftCount: whale.nftCount,
        rank: whale.rank,
        estimatedValueETH: whale.estimatedValueETH || 0,
      }));

      setData(holders);
    } catch (error) {
      console.error('Failed to fetch top holders:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const holder = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">
            Rank #{holder.rank}
          </p>
          <p className="text-sm text-gray-600 font-mono">
            {holder.ensName || holder.shortAddress}
          </p>
          <p className="text-sm text-blue-600 font-bold mt-2">
            {holder.nftCount} NFTs
          </p>
          <p className="text-xs text-gray-500">
            ≈ {holder.estimatedValueETH.toFixed(2)} ETH
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (rank: number) => {
    if (rank === 1) return '#EAB308'; // Gold
    if (rank === 2) return '#94A3B8'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#3B82F6'; // Blue for others
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner variant="ring" size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <p>No holder data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="shortAddress"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            label={{ value: 'NFTs Held', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar
            dataKey="nftCount"
            name="NFT Count"
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.rank)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopHoldersBarChart;
