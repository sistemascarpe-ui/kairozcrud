import React from 'react';
import { Building2, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { useTopCompanies } from '../../../hooks/useOptimizedSales';

const TopCompaniesList = () => {
  const { data: queryData, loading, error } = useTopCompanies(10);
  
  // Ensure data is always an array
  const data = Array.isArray(queryData?.data) ? queryData.data : [];





  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const getCompanyColor = (index) => {
    const colors = [
      { gradient: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600', text: 'text-emerald-700', icon: 'text-emerald-600' },
      { gradient: 'from-cyan-500 to-cyan-700', bg: 'bg-cyan-50', bar: 'bg-gradient-to-r from-cyan-400 to-cyan-600', text: 'text-cyan-700', icon: 'text-cyan-600' },
      { gradient: 'from-amber-500 to-amber-700', bg: 'bg-amber-50', bar: 'bg-gradient-to-r from-amber-400 to-amber-600', text: 'text-amber-700', icon: 'text-amber-600' },
      { gradient: 'from-rose-500 to-rose-700', bg: 'bg-rose-50', bar: 'bg-gradient-to-r from-rose-400 to-rose-600', text: 'text-rose-700', icon: 'text-rose-600' },
      { gradient: 'from-violet-500 to-violet-700', bg: 'bg-violet-50', bar: 'bg-gradient-to-r from-violet-400 to-violet-600', text: 'text-violet-700', icon: 'text-violet-600' },
      { gradient: 'from-lime-500 to-lime-700', bg: 'bg-lime-50', bar: 'bg-gradient-to-r from-lime-400 to-lime-600', text: 'text-lime-700', icon: 'text-lime-600' },
      { gradient: 'from-fuchsia-500 to-fuchsia-700', bg: 'bg-fuchsia-50', bar: 'bg-gradient-to-r from-fuchsia-400 to-fuchsia-600', text: 'text-fuchsia-700', icon: 'text-fuchsia-600' },
      { gradient: 'from-sky-500 to-sky-700', bg: 'bg-sky-50', bar: 'bg-gradient-to-r from-sky-400 to-sky-600', text: 'text-sky-700', icon: 'text-sky-600' },
    ];
    return colors[index % colors.length];
  };

  const maxRevenue = data?.length > 0 ? data[0].ingresos : 0;

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
    <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <Building2 className="h-5 w-5 sm:h-7 sm:w-7" />
              Empresas que Más Compran
            </h3>
            <p className="text-emerald-100 text-sm mt-1">
              Ranking de empresas por ingresos generados
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-white/30">
            <span className="text-sm font-semibold text-white">
              {data?.length || 0} {(data?.length || 0) === 1 ? 'empresa' : 'empresas'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {data?.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-500">
              No hay ventas registradas
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.slice(0, 10).map((company, index) => {
              const colors = getCompanyColor(index);
              const maxRevenue = data[0]?.ingresos || 1;
              const percentage = maxRevenue > 0 ? (company.ingresos / maxRevenue) * 100 : 0;

              return (
                <div
                  key={company.id}
                  className={`relative overflow-hidden rounded-xl border-2 border-emerald-200 ${colors.bg} shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="p-4 sm:p-5">
                    {/* Header con ranking y empresa */}
                    <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
                      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${colors.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                        <span className="text-base sm:text-lg font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.icon}`} />
                          <h4 className={`text-lg sm:text-xl font-bold ${colors.text} truncate`}>
                            {company.nombre}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            {company.cantidadClientes} {company.cantidadClientes === 1 ? 'cliente' : 'clientes'}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                            {company.totalVentas} {company.totalVentas === 1 ? 'compra' : 'compras'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas - Layout mejorado para móvil */}
                    <div className="bg-white bg-opacity-50 rounded-lg p-3 sm:p-4 mb-4">
                      <div className="text-center sm:text-left">
                        <p className={`text-xl sm:text-2xl font-bold ${colors.text} mb-1`}>
                          {formatCurrency(company.ingresos)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          ingresos totales
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="relative">
                      <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} transition-all duration-1000 ease-out shadow-inner`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                          {formatCurrency(company.ticketPromedio)} ticket promedio
                        </span>
                        <span className={`text-xs sm:text-sm font-semibold ${colors.text} text-center sm:text-right`}>
                          {company.totalVentas} ventas
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
              Y {(data?.length || 0) - 10} {(data?.length || 0) - 10 === 1 ? 'empresa' : 'empresas'} más
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopCompaniesList;

