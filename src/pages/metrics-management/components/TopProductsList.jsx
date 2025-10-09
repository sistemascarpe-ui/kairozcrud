import React from 'react';
import { TrendingUp, Award, Medal, Trophy } from 'lucide-react';

const TopProductsList = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No hay datos de productos vendidos</p>
      </div>
    );
  }

  // Calcular el máximo para las barras de progreso
  const maxSold = Math.max(...products.map(p => p.totalSold || p.quantity || 0));

  // Obtener colores y medallas según la posición
  const getRankStyle = (index) => {
    switch(index) {
      case 0:
        return {
          gradient: 'from-yellow-400 to-yellow-600',
          bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
          border: 'border-yellow-300',
          icon: Trophy,
          iconColor: 'text-yellow-600',
          barColor: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
          shadow: 'shadow-lg shadow-yellow-200'
        };
      case 1:
        return {
          gradient: 'from-gray-300 to-gray-500',
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          border: 'border-gray-300',
          icon: Medal,
          iconColor: 'text-gray-600',
          barColor: 'bg-gradient-to-r from-gray-400 to-gray-600',
          shadow: 'shadow-md shadow-gray-200'
        };
      case 2:
        return {
          gradient: 'from-orange-400 to-orange-600',
          bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
          border: 'border-orange-300',
          icon: Award,
          iconColor: 'text-orange-600',
          barColor: 'bg-gradient-to-r from-orange-400 to-orange-600',
          shadow: 'shadow-md shadow-orange-200'
        };
      default:
        return {
          gradient: 'from-blue-400 to-blue-600',
          bg: 'bg-white',
          border: 'border-gray-200',
          icon: null,
          iconColor: 'text-blue-600',
          barColor: 'bg-gradient-to-r from-blue-400 to-blue-600',
          shadow: 'shadow-sm'
        };
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        {products.slice(0, 10).map((product, index) => {
          const style = getRankStyle(index);
          const Icon = style.icon;
          const percentage = maxSold > 0 ? ((product.totalSold || product.quantity || 0) / maxSold) * 100 : 0;
          
          return (
            <div
              key={product.id || index}
              className={`relative overflow-hidden rounded-xl border-2 ${style.border} ${style.bg} ${style.shadow} transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  {/* Ranking y nombre del producto */}
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${style.gradient} rounded-full flex items-center justify-center ${index < 3 ? 'ring-4 ring-white' : ''}`}>
                      {Icon ? (
                        <Icon className="h-5 w-5 text-white" />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {product.sku || product.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.brand || product.marca} • {product.color}
                      </p>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-gray-900">
                      {product.totalSold || product.quantity}
                    </p>
                    <p className="text-xs text-gray-500">
                      vendidos
                    </p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${style.barColor} transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      ${(product.price || product.precio || 0).toLocaleString()} c/u
                    </span>
                    <span className="text-xs font-medium text-gray-600">
                      ${((product.totalSold || product.quantity || 0) * (product.price || product.precio || 0)).toLocaleString()} total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Y {products.length - 10} productos más
          </p>
        </div>
      )}
    </div>
  );
};

export default TopProductsList;