import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const InventoryChart = ({ data, loading }) => {
  const chartData = {
    labels: data?.map(item => item.label) || ['En Stock', 'Sin Stock'],
    datasets: [
      {
        data: data?.map(item => item.value) || [75, 10], // Datos de ejemplo si no hay datos reales
        backgroundColor: data?.map(item => {
          // Convertir hex a rgba con transparencia
          const hex = item.color.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          return `rgba(${r}, ${g}, ${b}, 0.8)`;
        }) || [
          'rgba(59, 130, 246, 0.8)', // blue-500 para "En Stock"
          'rgba(239, 68, 68, 0.8)',  // red-500 para "Sin Stock"
        ],
        borderColor: data?.map(item => {
          // Convertir hex a rgba
          const hex = item.color.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          return `rgba(${r}, ${g}, ${b}, 1)`;
        }) || [
          'rgba(59, 130, 246, 1)', // blue-500 para "En Stock"
          'rgba(239, 68, 68, 1)',  // red-500 para "Sin Stock"
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 14,
            weight: 'bold'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    elements: {
      arc: {
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse w-full h-full flex flex-col items-center justify-center">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-xl h-full">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default InventoryChart;