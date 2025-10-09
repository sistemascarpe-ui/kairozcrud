import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Award } from 'lucide-react';
import { salesService } from '../../../services/salesService';

const TopBrandsList = () => {
  const [loading, setLoading] = useState(true);
  const [allSales, setAllSales] = useState([]);
  const [brandStats, setBrandStats] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    loadSalesData();
  }, []);

  useEffect(() => {
    if (allSales.length > 0) {
      calculateBrandStats();
    }
  }, [selectedMonth, allSales]);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const { data: sales, error } = await salesService.getSalesNotes();
      
      if (error) {
        console.error('Error loading sales:', error);
        return;
      }

      setAllSales(sales || []);
      calculateBrandStats(sales || []);
    } catch (error) {
      console.error('Error in loadSalesData:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBrandStats = (salesData = allSales) => {
    let filteredSales = salesData;

    // Filtrar por mes si está seleccionado
    if (selectedMonth) {
      filteredSales = salesData.filter(sale => {
        if (sale.estado !== 'completada') return false;
        const saleDate = new Date(sale.fecha_venta || sale.created_at);
        const saleYearMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        return saleYearMonth === selectedMonth;
      });
    } else {
      // Solo ventas completadas
      filteredSales = salesData.filter(sale => sale.estado === 'completada');
    }

    // Agrupar por marca
    const brandData = {};
    
    filteredSales.forEach(sale => {
      const armazon = sale.armazon;
      if (!armazon || !armazon.marcas) return;
      
      const brandName = armazon.marcas.nombre || 'Sin marca';
      
      if (!brandData[brandName]) {
        brandData[brandName] = {
          name: brandName,
          totalSales: 0,
          totalRevenue: 0,
          products: new Set()
        };
      }
      
      brandData[brandName].totalSales += 1;
      brandData[brandName].totalRevenue += parseFloat(sale.precio_armazon || 0);
      if (armazon.id) {
        brandData[brandName].products.add(armazon.id);
      }
    });

    // Convertir a array y ordenar por ventas
    const sortedBrands = Object.values(brandData)
      .map(brand => ({
        ...brand,
        productsCount: brand.products.size
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    setBrandStats(sortedBrands);
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };

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

  const maxSales = brandStats.length > 0 ? brandStats[0].totalSales : 0;

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
          
          <div className="flex items-center gap-3">
            {/* Filtro de mes */}
            <div className="min-w-[200px]">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-white/50 transition-all cursor-pointer hover:bg-white/30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                  appearance: 'none'
                }}
              >
                <option value="" className="bg-purple-600 text-white">Todos los meses</option>
                {generateMonthOptions().map(option => (
                  <option key={option.value} value={option.value} className="bg-purple-600 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-white/30">
              <span className="text-sm font-semibold text-white">
                {brandStats.length} marcas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {brandStats.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-500">
              {selectedMonth ? 'No se encontraron ventas para el mes seleccionado' : 'No hay ventas registradas'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {brandStats.slice(0, 10).map((brand, index) => {
              const colors = getBrandColor(index);
              const percentage = maxSales > 0 ? (brand.totalSales / maxSales) * 100 : 0;
              const averagePrice = brand.totalSales > 0 ? brand.totalRevenue / brand.totalSales : 0;

              return (
                <div
                  key={brand.name}
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
                            {brand.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {brand.productsCount} {brand.productsCount === 1 ? 'modelo' : 'modelos'} diferentes
                          </p>
                        </div>
                      </div>

                      {/* Estadísticas */}
                      <div className="text-right ml-4">
                        <p className={`text-2xl font-bold ${colors.text}`}>
                          {brand.totalSales}
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
                          {formatCurrency(brand.totalRevenue)} total
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {brandStats.length > 10 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Y {brandStats.length - 10} marcas más
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBrandsList;

