// PieChart - Chart.js Pie Chart for Holder Distribution (ATLAS Design)

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title = 'Distribution' }) => {
  // ATLAS color scheme matching holder categories
  const defaultColors = [
    '#4E8EF7', // Blue - single holders
    '#34D399', // Green - small holders
    '#FBBF24', // Yellow - medium holders
    '#FB923C', // Orange - large holders
    '#F5A623', // Gold - whales
  ];

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) => d.color || defaultColors[i % defaultColors.length]),
        borderColor: '#1A1A24',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#F0F0F5',
          font: {
            size: 12,
            family: 'DM Sans, sans-serif',
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 36, 0.95)',
        titleColor: '#F0F0F5',
        bodyColor: '#9494A8',
        borderColor: '#2A2A3A',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc: number, val) => acc + (val as number), 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '320px', width: '100%' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PieChart;
