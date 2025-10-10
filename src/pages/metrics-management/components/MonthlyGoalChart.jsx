import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckCircle, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { salesService } from '../../../services/salesService';
import toast from 'react-hot-toast';

const MonthlyGoalChart = ({ refreshTrigger }) => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyData, setMonthlyData] = useState({
    totalSales: 0,
    completedSales: 0,
    pendingSales: 0,
    goal: 100000,
    goalAchieved: false,
    progressPercentage: 0
  });
  const [dailyData, setDailyData] = useState([]);

  const MONTHLY_GOAL = 100000; // $100k meta mensual

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth, refreshTrigger]);

  const loadMonthlyData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      // Obtener ventas del mes específico
      const { data: sales, error } = await salesService.getSalesWithVendors();
      
      if (error) {
        toast.error('Error al cargar datos del mes');
        return;
      }

      // Filtrar ventas del mes seleccionado
      const monthSales = sales?.filter(sale => {
        const saleDate = new Date(sale.created_at);
        // Normalizar fecha a medianoche para comparación precisa
        const saleDateNormalized = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
        return saleDateNormalized >= startDate && saleDateNormalized <= endDate;
      }) || [];

      // Calcular totales mensuales
      let totalRevenue = 0;
      let completedRevenue = 0;
      let pendingRevenue = 0;

      monthSales.forEach(sale => {
        const saleAmount = parseFloat(sale.total || 0);
        totalRevenue += saleAmount;
        
        if (sale.estado === 'completada') {
          completedRevenue += saleAmount;
        } else {
          pendingRevenue += saleAmount;
        }
      });

      // Calcular datos diarios para el calendario
      const dailySales = {};
      const daysInMonth = endDate.getDate();
      
      // Obtener la fecha de hoy sin hora (solo año, mes, día)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Inicializar todos los días del mes
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(parseInt(year), parseInt(month) - 1, day);
        dayDate.setHours(0, 0, 0, 0); // Eliminar la hora para comparación precisa
        const dayKey = `${year}-${String(parseInt(month)).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Comparar solo fechas sin hora
        const isToday = dayDate.getTime() === today.getTime();
        
        dailySales[dayKey] = {
          date: dayDate,
          day: day,
          totalSales: 0,
          completedSales: 0,
          pendingSales: 0,
          salesCount: 0,
          isFuture: dayDate.getTime() > today.getTime(),
          isToday: isToday
        };
      }

      // Agrupar ventas por día
      monthSales.forEach(sale => {
        // Convertir la fecha de la venta a fecha local y obtener solo año-mes-día
        const saleDate = new Date(sale.created_at);
        const dayKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
        
        if (dailySales[dayKey]) {
          const saleAmount = parseFloat(sale.total || 0);
          dailySales[dayKey].totalSales += saleAmount;
          dailySales[dayKey].salesCount += 1;
          
          if (sale.estado === 'completada') {
            dailySales[dayKey].completedSales += saleAmount;
          } else {
            dailySales[dayKey].pendingSales += saleAmount;
          }
        }
      });

      const progressPercentage = (totalRevenue / MONTHLY_GOAL) * 100;
      const goalAchieved = totalRevenue >= MONTHLY_GOAL;

      setMonthlyData({
        totalSales: totalRevenue,
        completedSales: completedRevenue,
        pendingSales: pendingRevenue,
        goal: MONTHLY_GOAL,
        goalAchieved,
        progressPercentage: Math.min(progressPercentage, 100)
      });

      setDailyData(Object.values(dailySales));

    } catch (error) {
      console.error('Error loading monthly data:', error);
      toast.error('Error al cargar datos del mes');
    } finally {
      setLoading(false);
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Generar opciones para los últimos 12 meses y próximos 3 meses
    for (let i = -12; i <= 3; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      options.push({ value, label });
    }
    
    return options.reverse();
  };

  const getProgressColor = () => {
    if (monthlyData.progressPercentage >= 100) return 'bg-green-500';
    if (monthlyData.progressPercentage >= 70) return 'bg-orange-500';
    if (monthlyData.progressPercentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = () => {
    if (monthlyData.progressPercentage >= 100) return 'text-green-600';
    if (monthlyData.progressPercentage >= 70) return 'text-orange-600';
    if (monthlyData.progressPercentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressMessage = () => {
    if (monthlyData.progressPercentage >= 100) return '🎉 ¡Meta Alcanzada!';
    if (monthlyData.progressPercentage >= 70) return '🔥 Buen Progreso';
    if (monthlyData.progressPercentage >= 40) return '⚡ Progreso Moderado';
    return '🚨 Necesita Atención';
  };

  const getDayColor = (dayData) => {
    if (dayData.isToday) {
      if (dayData.totalSales > 0) {
        return 'bg-green-200 text-green-800'; // Hoy con ventas
      } else {
        return 'bg-blue-100 text-blue-700'; // Hoy sin ventas
      }
    }
    if (dayData.isFuture) {
      return 'bg-gray-100 text-gray-400'; // Días futuros
    }
    if (dayData.totalSales === 0) {
      return 'bg-red-100 text-red-700'; // Sin ventas
    }
    if (dayData.totalSales > 0) {
      return 'bg-green-100 text-green-700'; // Con ventas
    }
    return 'bg-gray-100 text-gray-600';
  };

  const getDayBorderColor = (dayData) => {
    if (dayData.isToday) {
      return 'border-2 border-blue-500 shadow-md';
    }
    if (dayData.isFuture) {
      return 'border border-gray-200';
    }
    if (dayData.totalSales === 0) {
      return 'border border-red-200';
    }
    return 'border border-green-200';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getWeekdays = () => {
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  };

  const getCalendarWeeks = () => {
    if (!dailyData.length) return [];
    
    const weeks = [];
    const firstDay = dailyData[0];
    const startOfWeek = firstDay.date.getDay(); // 0 = Sunday
    
    // Agregar días vacíos al inicio si es necesario
    const firstWeek = [];
    for (let i = 0; i < startOfWeek; i++) {
      firstWeek.push(null);
    }
    
    let currentWeek = [...firstWeek];
    
    dailyData.forEach(dayData => {
      currentWeek.push(dayData);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Completar la última semana si es necesario
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${monthlyData.goalAchieved ? 'bg-green-100' : 'bg-orange-100'}`}>
              <Target className={`h-6 w-6 ${monthlyData.goalAchieved ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Meta Mensual de Ventas</h3>
              <p className="text-sm text-gray-600">Objetivo: ${MONTHLY_GOAL.toLocaleString()} por mes</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            onClick={loadMonthlyData}
            disabled={loading}
          >
            Actualizar
          </Button>
        </div>

        {/* Selector de mes */}
        <div className="mb-6">
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={getMonthOptions()}
            placeholder="Seleccionar mes"
          />
        </div>
        
        {/* Métricas del mes - Diseño responsivo mejorado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-blue-700 mb-1">Total del Mes</h4>
              <p className="text-xl font-bold text-blue-900 truncate w-full">
                ${monthlyData.totalSales.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className={`p-6 rounded-xl border ${
            monthlyData.progressPercentage >= 100 
              ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
              : monthlyData.progressPercentage >= 70
                ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                : monthlyData.progressPercentage >= 40
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
          }`}>
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 bg-white rounded-full shadow-sm mb-3 ${
                monthlyData.progressPercentage >= 100 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {monthlyData.progressPercentage >= 100 ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <h4 className={`text-sm font-medium mb-1 ${
                monthlyData.progressPercentage >= 100 
                  ? 'text-green-700' 
                  : monthlyData.progressPercentage >= 70
                    ? 'text-orange-700'
                    : monthlyData.progressPercentage >= 40
                      ? 'text-yellow-700'
                      : 'text-red-700'
              }`}>Progreso</h4>
              <p className={`text-xl font-bold ${getProgressTextColor()}`}>
                {monthlyData.progressPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-sm font-medium text-purple-700 mb-1">Restante</h4>
              <p className="text-xl font-bold text-purple-900 truncate w-full">
                ${Math.max(0, MONTHLY_GOAL - monthlyData.totalSales).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso hacia la meta</span>
            <span className={`text-sm font-medium ${getProgressTextColor()}`}>
              {monthlyData.progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(monthlyData.progressPercentage, 100)}%` }}
            ></div>
          </div>
          
          {/* Indicador de estado del progreso */}
          <div className="flex items-center justify-center mt-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              monthlyData.progressPercentage >= 100 
                ? 'bg-green-100 text-green-800' 
                : monthlyData.progressPercentage >= 70
                  ? 'bg-orange-100 text-orange-800'
                  : monthlyData.progressPercentage >= 40
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
            }`}>
              {getProgressMessage()}
            </span>
          </div>
        </div>
      </div>

      {/* Calendario de ventas diarias */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-800">Calendario de Ventas Diarias</h4>
          </div>
          
          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-gray-600">Con ventas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-gray-600">Sin ventas</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-gray-600">Días futuros</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded shadow-sm"></div>
              <span className="text-gray-600 font-medium">Hoy</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="text-green-600">✓ = Completadas</span>
              <span className="text-yellow-600">⏳ = Pendientes</span>
            </div>
          </div>

          {/* Calendario Desktop - Oculto en móvil */}
          <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Headers de días de la semana */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {getWeekdays().map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Días del mes */}
            <div className="divide-y divide-gray-200">
              {getCalendarWeeks().map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7">
                  {week.map((dayData, dayIndex) => (
                    <div key={dayIndex} className="h-28 border-r border-gray-200 last:border-r-0">
                      {dayData ? (
                        <div className={`h-full p-3 ${getDayColor(dayData)} ${getDayBorderColor(dayData)} transition-colors hover:opacity-80`}>
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold">{dayData.day}</span>
                              {dayData.salesCount > 0 && (
                                <span className="text-xs bg-white bg-opacity-70 px-1.5 py-0.5 rounded">
                                  {dayData.salesCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              {dayData.totalSales > 0 ? (
                                <div className="text-center">
                                  <div className="text-sm font-bold mb-1.5">
                                    {formatCurrency(dayData.totalSales)}
                                  </div>
                                  <div className="text-xs space-y-1">
                                    {dayData.completedSales > 0 && (
                                      <div className="text-green-700 font-medium">
                                        ✓ {formatCurrency(dayData.completedSales)}
                                      </div>
                                    )}
                                    {dayData.pendingSales > 0 && (
                                      <div className="text-yellow-700 font-medium">
                                        ⏳ {formatCurrency(dayData.pendingSales)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : !dayData.isFuture ? (
                                <div className="text-center text-sm opacity-75 font-medium">
                                  Sin ventas
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full bg-gray-50"></div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Calendario Móvil - Lista completa de días */}
          <div className="lg:hidden bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header móvil */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-700">Calendario del Mes</h5>
                <span className="text-sm text-gray-500">
                  {dailyData.filter(day => !day.isFuture).length} días
                </span>
              </div>
            </div>
            
            {/* Lista de todos los días (pasados y hoy) */}
            <div className="max-h-96 overflow-y-auto">
              {dailyData
                .filter(day => !day.isFuture)
                .sort((a, b) => b.date - a.date)
                .map((dayData, index) => (
                  <div key={index} className={`border-b border-gray-100 last:border-b-0 p-4 ${getDayColor(dayData)} ${dayData.isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          dayData.isToday 
                            ? 'bg-blue-500 text-white' 
                            : dayData.totalSales > 0 
                              ? 'bg-white bg-opacity-70' 
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {dayData.day}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {dayData.date.toLocaleDateString('es-ES', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </p>
                          {dayData.isToday && (
                            <span className="text-xs text-blue-600 font-medium">Hoy</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {dayData.totalSales > 0 ? (
                          <>
                            <p className="font-bold text-lg">
                              {formatCurrency(dayData.totalSales)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {dayData.salesCount} venta{dayData.salesCount !== 1 ? 's' : ''}
                            </p>
                          </>
                        ) : (
                          <div className="text-center">
                            <p className="font-medium text-red-600 text-sm">Sin ventas</p>
                            <div className="w-6 h-6 mx-auto mt-1 bg-red-200 rounded-full flex items-center justify-center">
                              <span className="text-red-600 text-xs">✗</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Detalle de ventas - solo si hay ventas */}
                    {dayData.totalSales > 0 && (
                      <div className="space-y-1">
                        {dayData.completedSales > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">✓</span>
                              <span className="text-gray-600">Completadas</span>
                            </div>
                            <span className="font-medium text-green-700">
                              {formatCurrency(dayData.completedSales)}
                            </span>
                          </div>
                        )}
                        {dayData.pendingSales > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-yellow-600">⏳</span>
                              <span className="text-gray-600">Pendientes</span>
                            </div>
                            <span className="font-medium text-yellow-700">
                              {formatCurrency(dayData.pendingSales)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              
              {/* Mensaje si no hay datos */}
              {dailyData.filter(day => !day.isFuture).length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <Calendar className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm">No hay datos para este mes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen del mes */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Mes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border border-green-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-green-700 mb-1">Ventas Completadas</h4>
                <p className="text-lg sm:text-xl font-bold text-green-900 truncate w-full">
                  {formatCurrency(monthlyData.completedSales)}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl border border-yellow-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h4 className="text-sm font-medium text-yellow-700 mb-1">Ventas Pendientes</h4>
                <p className="text-lg sm:text-xl font-bold text-yellow-900 truncate w-full">
                  {formatCurrency(monthlyData.pendingSales)}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200 sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-sm font-medium text-blue-700 mb-1">Días con Ventas</h4>
                <p className="text-lg sm:text-xl font-bold text-blue-900">
                  {dailyData.filter(day => day.totalSales > 0).length} / {dailyData.filter(day => !day.isFuture).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyGoalChart;
