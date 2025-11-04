import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Share2, User, DollarSign, ShoppingCart, Calendar, Filter } from 'lucide-react';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { salesService } from '../../../services/salesService';
import { userService } from '../../../services/userService';
import { useVendorPerformance } from '../../../hooks/useOptimizedSales';
import toast from 'react-hot-toast';

const VendorPerformanceDetail = () => {
  const [users, setUsers] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return end;
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Hook optimizado para rendimiento de vendedores
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { data: vendorPerformanceData, isLoading, error } = useVendorPerformance(startDate, endDate, currentPage, pageSize);
  const vendorData = vendorPerformanceData?.data || [];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Cargar usuarios
      const usersResult = await userService.getUsers();
      if (usersResult?.data) {
        setUsers(usersResult.data);
      }
    } catch (error) {
      toast.error('Error al cargar usuarios');
      console.error('Error loading users:', error);
    }
  };



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleClearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setShowDateFilter(false);
    setSelectedMonth('');
  };

  const handleApplyDateFilter = () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }
    // Los datos se actualizarán automáticamente por el useEffect
    toast.success('Filtro de fechas aplicado');
  };

  const handleQuickDateFilter = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start);
    setEndDate(end);
    setShowDateFilter(true);
    setSelectedMonth(''); // Limpiar filtro de mes
  };

  const handleThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    
    setStartDate(start);
    setEndDate(end);
    setShowDateFilter(true);
    setSelectedMonth(''); // Limpiar filtro de mes
  };

  const handleLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    
    setStartDate(start);
    setEndDate(end);
    setShowDateFilter(true);
    setSelectedMonth(''); // Limpiar filtro de mes
  };
  
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Generar últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };
  
  const handleMonthChange = (monthValue) => {
    setSelectedMonth(monthValue);
    
    if (!monthValue) {
      // Limpiar filtro
      setStartDate(null);
      setEndDate(null);
      return;
    }
    
    // Parsear año y mes
    const [year, month] = monthValue.split('-').map(Number);
    
    // Crear fechas de inicio y fin del mes
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0); // Último día del mes
    end.setHours(23, 59, 59, 999);
    
    setStartDate(start);
    setEndDate(end);
  };

  const isDefaultCurrentMonth = () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth === ym;
  };

  // Componente personalizado para el input del DatePicker
  const CustomDateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <Input
      ref={ref}
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      className="cursor-pointer"
    />
  ));

  const filteredVendors = selectedVendor 
    ? vendorData.filter(vendor => vendor.id === selectedVendor)
    : vendorData;

  if (isLoading) {
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <TrendingUp className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-500 mb-4">No se pudieron cargar los datos de rendimiento de vendedores</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Rendimiento Detallado de Vendedores
              </h3>
              <div className="flex items-center space-x-2 flex-wrap">
                <p className="text-sm text-gray-500">
                  Análisis de ventas individuales y compartidas
                </p>
                {selectedMonth && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isDefaultCurrentMonth() ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {isDefaultCurrentMonth() ? 'Vista predeterminada: Mes actual' : 'Filtrado por mes'}
                  </span>
                )}
                {(startDate || endDate) && !selectedMonth && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Filter className="h-3 w-3 mr-1" />
                    Filtrado por fechas
                  </span>
                )}
                {selectedVendor && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <User className="h-3 w-3 mr-1" />
                    Vendedor específico
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-600">Página</label>
              <button
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">{currentPage}</span>
              <button
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={Array.isArray(vendorPerformanceData) && vendorPerformanceData.length < pageSize}
              >
                Siguiente
              </button>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                className="px-2 py-1 bg-gray-50 border-0 text-gray-800 rounded"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            onClick={loadUsers}
            disabled={isLoading}
          >
            Actualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-lg mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">👥 Filtros de Rendimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white bg-blue-500 px-3 py-1 rounded-full">Filtrar por vendedor</label>
              <div className="bg-blue-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-blue-200 transition-all duration-200">
                <Select
                  value={selectedVendor}
                  onChange={setSelectedVendor}
                  options={[
                    { value: '', label: 'Todos los vendedores' },
                    ...users.map(user => ({
                      value: user.id,
                      label: `${user.nombre} ${user.apellido || ''}`.trim()
                    }))
                  ]}
                  placeholder=""
                  className="w-full [&>div>button]:bg-blue-50 [&>div>button]:border-0 [&>div>button]:text-blue-800 [&>div>button]:hover:bg-blue-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-blue-50 [&>div>div>div>div]:text-blue-800 [&>div>div>div>div]:hover:bg-blue-100"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white bg-green-500 px-3 py-1 rounded-full">Filtrar por mes</label>
              <div className="bg-green-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-green-200 transition-all duration-200">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full px-3 py-2 bg-green-50 border-0 text-green-800 focus:outline-none focus:ring-0 shadow-none rounded-xl"
                >
                  <option value="">Todos los meses</option>
                  {generateMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white bg-purple-500 px-3 py-1 rounded-full">Filtro por fechas</label>
              <div className="bg-purple-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-purple-200 transition-all duration-200">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Calendar"
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`w-full border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:outline-none shadow-none font-semibold ${
                    showDateFilter ? 'text-purple-700' : 'text-purple-600 hover:text-purple-800'
                  }`}
                >
                  Filtro por Fechas
                </Button>
              </div>
            </div>
          </div>
            {(startDate || endDate) && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {startDate && endDate 
                    ? `${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}`
                    : startDate 
                      ? `Desde: ${startDate.toLocaleDateString('es-ES')}`
                      : `Hasta: ${endDate.toLocaleDateString('es-ES')}`
                  }
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="X"
                  onClick={handleClearDateFilter}
                  className="text-gray-400 hover:text-gray-600"
                />
              </div>
            )}

          {/* Panel de filtro de fechas */}
          {showDateFilter && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setStartDate(new Date(e.target.value));
                        setSelectedMonth(''); // Limpiar filtro de mes
                      } else {
                        setStartDate(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        date.setHours(23, 59, 59, 999);
                        setEndDate(date);
                        setSelectedMonth(''); // Limpiar filtro de mes
                      } else {
                        setEndDate(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Accesos rápidos:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleThisMonth}
                  >
                    Este mes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLastMonth}
                  >
                    Mes pasado
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter(7)}
                  >
                    Últimos 7 días
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateFilter(30)}
                  >
                    Últimos 30 días
                  </Button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyDateFilter}
                >
                  Aplicar filtro
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredVendors.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de vendedores</h3>
            <p className="text-gray-500">No se encontraron ventas para el período seleccionado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Vendor Summary */}
                <div 
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                >
                  {/* Desktop Layout */}
                  <div className="hidden lg:flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{vendor.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {vendor.totalSales.count} ventas totales
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatCurrency(vendor.totalSales.revenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="flex items-center justify-center text-green-600 mb-1">
                            <User className="h-4 w-4 mr-1" />
                            <span className="font-medium">Individual</span>
                          </div>
                          <p className="text-gray-900 font-semibold">{vendor.individualSales.count} ventas</p>
                          <p className="text-gray-600">{formatCurrency(vendor.individualSales.revenue)}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center text-blue-600 mb-1">
                            <Share2 className="h-4 w-4 mr-1" />
                            <span className="font-medium">Compartida</span>
                          </div>
                          <p className="text-gray-900 font-semibold">{vendor.sharedSales.count} ventas</p>
                          <p className="text-gray-600">{formatCurrency(vendor.sharedSales.revenue)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="lg:hidden">
                    {/* Header con info básica */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-gray-900">{vendor.name}</h4>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span className="flex items-center">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {vendor.totalSales.count} ventas
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(vendor.totalSales.revenue)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detalles de ventas en móvil */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Ventas Individuales */}
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center mb-2">
                          <User className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">Individuales</span>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-900">{vendor.individualSales.count}</p>
                          <p className="text-xs text-green-700">ventas</p>
                          <p className="text-sm font-semibold text-green-800 mt-1">
                            {formatCurrency(vendor.individualSales.revenue)}
                          </p>
                        </div>
                      </div>

                      {/* Ventas Compartidas */}
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center mb-2">
                          <Share2 className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-800">Compartidas</span>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-900">{vendor.sharedSales.count}</p>
                          <p className="text-xs text-blue-700">ventas</p>
                          <p className="text-sm font-semibold text-blue-800 mt-1">
                            {formatCurrency(vendor.sharedSales.revenue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVendor === vendor.id && (
                  <div className="p-6 bg-white border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Detailed Stats */}
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Estadísticas Detalladas</h5>
                        <div className="space-y-4">
                          {/* Individual Sales */}
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center mb-3">
                              <User className="h-5 w-5 text-green-600 mr-2" />
                              <h6 className="font-medium text-green-900">Ventas Individuales</h6>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-green-700">Total: {vendor.individualSales.count}</p>
                                <p className="text-green-700">Completadas: {vendor.individualSales.completed}</p>
                                <p className="text-green-700">Pendientes: {vendor.individualSales.pending}</p>
                              </div>
                              <div>
                                <p className="text-green-700 font-medium">{formatCurrency(vendor.individualSales.revenue)}</p>
                                <p className="text-green-600">{formatCurrency(vendor.individualSales.completedRevenue)}</p>
                                <p className="text-green-500">{formatCurrency(vendor.individualSales.pendingRevenue)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Shared Sales */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center mb-3">
                              <Share2 className="h-5 w-5 text-blue-600 mr-2" />
                              <h6 className="font-medium text-blue-900">Ventas Compartidas</h6>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-blue-700">Total: {vendor.sharedSales.count}</p>
                                <p className="text-blue-700">Completadas: {vendor.sharedSales.completed}</p>
                                <p className="text-blue-700">Pendientes: {vendor.sharedSales.pending}</p>
                              </div>
                              <div>
                                <p className="text-blue-700 font-medium">{formatCurrency(vendor.sharedSales.revenue)}</p>
                                <p className="text-blue-600">{formatCurrency(vendor.sharedSales.completedRevenue)}</p>
                                <p className="text-blue-500">{formatCurrency(vendor.sharedSales.pendingRevenue)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Sales */}
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Ventas Recientes</h5>
                        <div className="space-y-3">
                          {vendor.recentSales.map((sale) => (
                            <div key={sale.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {sale.isShared && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <Share2 className="h-3 w-3 mr-1" />
                                      Compartida
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    sale.estado === 'completada' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {sale.estado}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">{formatDate(sale.fecha)}</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{sale.cliente}</p>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">
                                  {sale.isShared ? `Participación: ${formatCurrency(sale.shareAmount)}` : `Total: ${formatCurrency(sale.total)}`}
                                </span>
                                {sale.isShared && sale.otherVendors.length > 0 && (
                                  <span className="text-xs text-blue-600">
                                    Con: {sale.otherVendors.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPerformanceDetail;
