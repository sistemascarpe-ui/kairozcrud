import React from 'react';
import { Package, Award } from 'lucide-react';
import { useTopBrands } from '../../../hooks/useOptimizedSales';

const TopBrandsList = () => {
  const { data: queryData, loading, error } = useTopBrands(10);

  // Ensure data is always an array
  const data = Array.isArray(queryData?.data) ? queryData.data : [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const getBrandColor = (index) => {
    const colors = [
      { gradient: 'from-purple-500 to-purple-700', bg: 'bg-purple-50', bar: 'bg-gradient-to-r from-purple-400 to-purple-600', text: 'text-purple-700' },
      { gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', bar: 'bg-gradient-to-r from-blue-400 to-blue-600', text: 'text-blue-700' },
      { gradient: 'from-green-500 to-green-700', bg: 'bg-green-50', bar: 'bg-gradient-to-r from-green-400 to-green-600', text: 'text-green-700' },
      { gradient: 'from-orange-500 to-orange-700', bg: 'bg-orange-50', bar: 'bg-gradient-to-r from-orange-400 to-orange-600', text: 'text-orange-700' },
      { gradient: 'from-pink-500 to-pink-700', bg: 'bg-pink-50', bar: 'bg-gradient-to-r from-pink-400 to-pink-600', text: 'text-pink-700' },
      { gradient: 'from-indigo-500 to-indigo-700', bg: 'bg-indigo-50', bar: 'bg-gradient-to-r from-indigo-400 to-indigo-600', text: 'text-indigo-700' },
      { gradient: 'from-red-500 to-red-700', bg: 'bg-red-50', bar: 'bg-gradient-to-r from-red-400 to-red-600', text: 'text-red-700' },
      { gradient: 'from-teal-500 to-teal-700', bg: 'bg-teal-50', bar: 'bg-gradient-to-r from-teal-400 to-teal-600', text: 'text-teal-700' },
    ];
    return colors[index % colors.length];
  };

  const maxSales = data.length > 0 ? data[0].cantidad : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl border border-purple-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Award className="h-7 w-7" />
              Marcas Más Vendidas
            </h3>
            <p className="text-purple-100 text-sm mt-1">
              Ranking de marcas por cantidad de ventas
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-white/30">
            <span className="text-sm font-semibold text-white">
              {data.length || 0} marcas
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-500">
              No hay ventas registradas
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.slice(0, 10).map((brand, index) => {
              const colors = getBrandColor(index);
              const maxSales = data[0]?.cantidad || 1;
              const percentage = maxSales > 0 ? (brand.cantidad / maxSales) * 100 : 0;
              const averagePrice = brand.cantidad > 0 ? brand.ingresos / brand.cantidad : 0;

              return (
                <div
                  key={brand.id || brand.nombre || index}
                  className={`relative overflow-hidden rounded-xl border-2 border-purple-200 ${colors.bg} shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      {/* Ranking y marca */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                          <span className="text-lg font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xl font-bold ${colors.text} truncate`}>
                            {brand.nombre}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Marca de armazones
                          </p>
                        </div>
                      </div>

                      {/* Estadísticas */}
                      <div className="text-right ml-4">
                        <p className={`text-2xl font-bold ${colors.text}`}>
                          {brand.cantidad}
                        </p>
                        <p className="text-xs text-gray-500">
                          ventas
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="relative">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} transition-all duration-1000 ease-out shadow-inner`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">
                          {formatCurrency(averagePrice)} promedio
                        </span>
                        <span className={`text-sm font-semibold ${colors.text}`}>
                          {formatCurrency(brand.ingresos)} total
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(data?.length || 0) > 10 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Y {(data?.length || 0) - 10} marcas más
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBrandsList;

