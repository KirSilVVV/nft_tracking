// LineChart - Chart.js Line Chart for Activity Trends (ATLAS Design)

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
  data: { label: string; value: number }[];
  title?: string;
  color?: string;
  yAxisLabel?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title = 'Activity Trend',
  color = '#F5A623', // ATLAS gold
  yAxisLabel = 'Transactions'
}) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: yAxisLabel,
        data: data.map(d => d.value),
        borderColor: color,
        backgroundColor: 'rgba(245, 166, 35, 0.1)', // Gold with low transparency
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: '#1A1A24',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#FFC04D',
        pointHoverBorderColor: color,
        fill: true,
        tension: 0.3, // Smooth curves
      },
    ],
  };

  const options: ChartOptions<'line'> = {
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
            return `${context.parsed.y} transactions`;
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
          color: 'rgba(255, 255, 255, 0.03)',
          lineWidth: 1,
        },
        ticks: {
          color: '#9494A8',
          font: {
            size: 11,
            family: 'DM Sans, sans-serif',
          },
          maxRotation: 0,
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <div style={{ height: '280px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChart;
