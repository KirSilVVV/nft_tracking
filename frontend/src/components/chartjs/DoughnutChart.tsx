// DoughnutChart - Chart.js Doughnut Chart (ATLAS Design)

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  centerText?: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  title = 'Distribution',
  centerText = ''
}) => {
  // ATLAS color scheme
  const defaultColors = [
    '#4E8EF7', // Blue
    '#34D399', // Green
    '#F5A623', // Gold
    '#FF6B6B', // Red
    '#A78BFA', // Purple
  ];

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) => d.color || defaultColors[i % defaultColors.length]),
        borderColor: '#1A1A24',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%', // Thickness of doughnut
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
    <div style={{ height: '320px', width: '100%', position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
      {centerText && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F0F0F5' }}>
            {centerText}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoughnutChart;
