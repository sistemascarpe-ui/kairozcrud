import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Icon from '../../../components/AppIcon';

// Registro de los componentes necesarios de Chart.js para que funcionen los gráficos
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ChartContainer = ({ 
  title, 
  type = 'line', 
  data = [], 
  loading = false,
  height = '300px' 
}) => {

  // Opciones de configuración comunes para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ocultamos la leyenda por defecto, ya que tenemos una personalizada
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb', // Color de la cuadrícula
        },
        ticks: {
          color: '#6b7280', // Color de los números del eje Y
        },
      },
      x: {
        grid: {
          display: false, // Ocultamos la cuadrícula vertical
        },
        ticks: {
          color: '#6b7280', // Color de las etiquetas del eje X
        },
      },
    },
  };

  // Preparamos los datos para el gráfico de LÍNEAS (Ventas por Período)
  const lineChartData = {
    labels: data.map(item => item.label), // Eje X: 'Sep 23', 'Sep 24', etc.
    datasets: [
      {
        label: 'Ingresos Completados',
        data: data.map(item => item.completedRevenue), // Eje Y: El monto de los ingresos
        borderColor: '#2563eb', // Color de la línea
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3, // Curvatura de la línea
      },
    ],
  };

  // Preparamos los datos para el gráfico de DONA (Estado del Inventario)
  const doughnutChartData = {
    labels: data.map(item => item.label), // 'En Stock', 'Stock Bajo', 'Sin Stock'
    datasets: [
      {
        data: data.map(item => item.value), // El número de productos en cada categoría
        backgroundColor: data.map(item => item.color), // Los colores que definimos en el service
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };
  
  // Opciones específicas para el gráfico de dona para que no muestre los ejes
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // El grosor del anillo
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          }
        }
      }
    },
  };

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <Icon name="BarChart3" size={48} className="mx-auto mb-2" />
            <p>No hay datos disponibles</p>
            <p className="text-sm">Intenta seleccionar otro período</p>
          </div>
        </div>
      );
    }

    switch (type) {
      case 'line':
        return <Line options={chartOptions} data={lineChartData} />;
      case 'doughnut':
        return <Doughnut options={doughnutOptions} data={doughnutChartData} />;
      default:
        return <p>Tipo de gráfico no soportado.</p>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-gray-100 rounded">
            <Icon name="Download" size={16} className="text-gray-500" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Icon name="MoreHorizontal" size={16} className="text-gray-500" />
          </button>
        </div>
      </div>
      
      <div style={{ height }}>
        {renderChart()}
      </div>
      
      {/* Leyenda para el gráfico de dona */}
      {type === 'doughnut' && data.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
          {data.map(item => (
            <div key={item.label} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-gray-600">{item.label}</span>
              <span className="text-gray-800 font-medium">({item.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartContainer;