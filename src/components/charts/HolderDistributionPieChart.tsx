import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Distribution {
  single: number;
  small: number;
  medium: number;
  large: number;
  whales: number;
}

interface HolderDistributionPieChartProps {
  distribution: Distribution;
}

const COLORS = ['#3B82F6', '#10B981', '#FBBF24', '#F97316', '#EF4444'];

const HolderDistributionPieChart: React.FC<HolderDistributionPieChartProps> = ({ distribution }) => {
  const data = [
    { name: 'Single (1 NFT)', value: distribution.single, color: COLORS[0] },
    { name: 'Small (2-5)', value: distribution.small, color: COLORS[1] },
    { name: 'Medium (6-10)', value: distribution.medium, color: COLORS[2] },
    { name: 'Large (11-19)', value: distribution.large, color: COLORS[3] },
    { name: 'Whales (20+) 🐋', value: distribution.whales, color: COLORS[4] },
  ].filter(item => item.value > 0); // Only show non-zero categories

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = distribution.single + distribution.small + distribution.medium + distribution.large + distribution.whales;
      const percentage = ((data.value / total) * 100).toFixed(1);

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value.toLocaleString()} holders ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show labels for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <p>No distribution data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const total = distribution.single + distribution.small + distribution.medium + distribution.large + distribution.whales;
              const percentage = ((entry.payload.value / total) * 100).toFixed(1);
              return `${value}: ${entry.payload.value} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HolderDistributionPieChart;
