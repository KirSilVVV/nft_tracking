// BarChart - Chart.js Bar Chart for Top Holders (ATLAS Design)

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  data: { label: string; value: number }[];
  title?: string;
  color?: string;
  yAxisLabel?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title = 'Bar Chart',
  color = '#F5A623', // ATLAS gold
  yAxisLabel = 'Value'
}) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: yAxisLabel,
        data: data.map(d => d.value),
        backgroundColor: 'rgba(245, 166, 35, 0.6)', // Gold with transparency
        borderColor: color,
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(245, 166, 35, 0.8)',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 36, 0.95)',
        titleColor: '#F0F0F5',
        bodyColor: '#9494A8',
        borderColor: '#2A2A3A',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => {
            return `${context.parsed.y} NFTs`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          color: '#9494A8',
          font: {
            size: 11,
            family: 'DM Sans, sans-serif',
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9494A8',
          font: {
            size: 11,
            family: 'JetBrains Mono, monospace',
          },
          maxRotation: 45,
          minRotation: 45,
          padding: 4,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ height: '280px', width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
