import React, { useState, useEffect, forwardRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Search, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import SalesTable from './components/SalesTable';
import NewSalesModal from '../../components/NewSalesModal';

import { salesService } from '../../services/salesService';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useMetrics } from '../../contexts/MetricsContext';
import { useOptimizedSales, useSalesCount } from '../../hooks/useOptimizedSales';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { includesNormalized, anyWordStartsWith } from '../../utils/textNormalize';

// Input personalizado para darle el estilo correcto al calendario
const CustomDateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div className="relative">
    <Input
      onClick={onClick}
      ref={ref}
      value={value}
      placeholder={placeholder}
      readOnly
      className="cursor-pointer w-full bg-white" // Aseguramos fondo blanco
    />
    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
  </div>
));

const SalesManagement = () => {
  const { user, userProfile } = useAuth();
  const { notifySaleCreated, notifySaleUpdate } = useMetrics();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
  const [vendedores, setVendedores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendedorFilter, setVendedorFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [monthFilter, setMonthFilter] = useState(''); // Filtro de mes para la tabla
  
  // Filtro de mes para estadísticas
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [stats, setStats] = useState({ 
    totalSales: 0, 
    totalRevenue: 0, 
    completedRevenue: 0, 
    pendingRevenue: 0 
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [salesPerPage] = useState(20);

  // Usar hooks optimizados
  const { data: salesData, isLoading: salesLoading, error: salesError } = useOptimizedSales(1, null);
  const { data: salesCountData } = useSalesCount();

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { filterSales(); }, [sales, searchTerm, statusFilter, vendedorFilter, selectedDate, monthFilter]);
  useEffect(() => { calculateMonthStats(); }, [sales, selectedMonth, selectedYear]);

  // Actualizar sales cuando lleguen los datos optimizados
  useEffect(() => {
    if (salesData?.data) {
      setSales(salesData.data);
    }
  }, [salesData]);

  // Actualizar loading basado en el estado de los hooks
  useEffect(() => {
    setLoading(salesLoading);
  }, [salesLoading]);

  const loadInitialData = async () => {
    try {
      console.log('🔄 Cargando vendedores...');
      const vendorsResult = await userService.getUsers();
      
      console.log('👥 Resultado de vendedores:', vendorsResult);
      
      if (vendorsResult.data) {
        console.log('✅ Datos de vendedores cargados:', vendorsResult.data.length, 'vendedores');
        setVendedores(vendorsResult.data);
      } else {
        console.log('❌ No se pudieron cargar los vendedores:', vendorsResult.error);
      }
    } catch (error) { 
      console.error('💥 Error en loadInitialData:', error);
      toast.error('Error inesperado al cargar los datos'); 
    }
  };
  
  const calculateMonthStats = () => {
    if (!sales || sales.length === 0) {
      setStats({ totalSales: 0, totalRevenue: 0, completedRevenue: 0, pendingRevenue: 0 });
      return;
    }
    
    // Filtrar ventas por mes y año seleccionados usando zona horaria de México
    const filteredByMonth = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const mexicoSaleDate = new Date(saleDate.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
      return mexicoSaleDate.getMonth() === selectedMonth && mexicoSaleDate.getFullYear() === selectedYear;
    });
    
    const totalSales = filteredByMonth.length;
    const completedSalesData = filteredByMonth.filter(sale => sale.estado === 'completada');
    const pendingSalesData = filteredByMonth.filter(sale => sale.estado === 'pendiente');
    
    const completedRevenue = completedSalesData.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    const pendingRevenue = pendingSalesData.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    const totalRevenue = completedRevenue + pendingRevenue;
    
    setStats({ totalSales, totalRevenue, completedRevenue, pendingRevenue });
  };
  
  const getLast4 = (folio) => {
    const digits = String(folio || '').replace(/\D/g, '');
    if (!digits) return -1;
    return parseInt(digits.slice(-4), 10);
  };

  const filterSales = () => {
    let filtered = [...sales];
    if (searchTerm) {
      const term = searchTerm;
      filtered = filtered.filter(s => {
        // Search in customer name (both full name and individual words)
        const customerName = s.cliente?.nombre || '';
        const customerNameMatch = includesNormalized(customerName, term) ||
          anyWordStartsWith(customerName, term);
        
        // Search in vendor names (support multiple vendors)
        const vendorNames = (s.vendedores || [])
          .map(v => `${v?.nombre || ''} ${v?.apellido || ''}`.trim())
          .filter(Boolean);
        const vendorNameMatch = vendorNames.some(name => 
          includesNormalized(name, term) || anyWordStartsWith(name, term)
        );
        
        return customerNameMatch || vendorNameMatch;
      });
    }
    if (selectedDate) {
      filtered = filtered.filter(s => {
        const saleDate = new Date(s.created_at);
        const mexicoSaleDate = new Date(saleDate.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
        const mexicoSelectedDate = new Date(selectedDate.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
        return mexicoSaleDate.toDateString() === mexicoSelectedDate.toDateString();
      });
    }
    if (monthFilter) {
      // Filtrar por mes en formato "YYYY-MM" usando zona horaria de México
      filtered = filtered.filter(s => {
        const saleDate = new Date(s.created_at);
        const mexicoSaleDate = new Date(saleDate.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
        const saleYearMonth = `${mexicoSaleDate.getFullYear()}-${String(mexicoSaleDate.getMonth() + 1).padStart(2, '0')}`;
        return saleYearMonth === monthFilter;
      });
    }
    if (vendedorFilter) {
      // Include sale if any of its vendors matches the selected vendor
      filtered = filtered.filter(s => (s.vendedores || []).some(v => String(v.id) === String(vendedorFilter)));
    }
    if (statusFilter) {
      filtered = filtered.filter(s => s.estado === statusFilter);
    }
    filtered.sort((a, b) => {
      const ba = getLast4(b.folio);
      const aa = getLast4(a.folio);
      if (ba !== aa) return ba - aa;
      const bd = new Date(b.created_at || 0).getTime();
      const ad = new Date(a.created_at || 0).getTime();
      return bd - ad;
    });
    setFilteredSales(filtered);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate(null);
    setVendedorFilter('');
    setStatusFilter('');
    setMonthFilter('');
  };


  const handleCreateSale = () => { 
    setSelectedSale(null); 
    // Pequeño delay para asegurar que el modal se resetee completamente
    setTimeout(() => setIsModalOpen(true), 0); 
  };
  const handleEditSale = (sale) => { setSelectedSale(sale); setIsModalOpen(true); };

const handleSaveSale = async (saleData) => {
  try {
    setModalLoading(true);
    
    // --- VALIDACIONES CORREGIDAS ---
    // Estas validaciones ahora se basan en los datos que envía el modal.
    if (!saleData.cliente_ids || saleData.cliente_ids.length === 0) {
      toast.error('Error: Debe seleccionar al menos un cliente');
      setModalLoading(false); // Detener el spinner
      return;
    }
    
    // Esta es la línea clave que se corrigió:
    if (!saleData.vendedor_ids || saleData.vendedor_ids.length === 0) {
      toast.error('Error: Debe seleccionar quién atendió la venta');
      setModalLoading(false); // Detener el spinner
      return;
    }
    
    if (!saleData.productos || saleData.productos.length === 0) {
      toast.error('Error: La venta debe tener al menos un producto');
      setModalLoading(false); // Detener el spinner
      return;
    }

    // Preparar los datos para guardar
    const dataToSave = { ...saleData };

    console.log('Datos a guardar:', dataToSave);

    let result;
    if (selectedSale) {
      // Mapear edición de folio desde folio_manual a folio real
      if (typeof dataToSave.folio_manual !== 'undefined') {
        const last4Raw = String(dataToSave.folio_manual || '').replace(/\D/g, '');
        const last4 = last4Raw.padStart(4, '0').slice(-4);
        const originalFolio = String(selectedSale.folio || '');
        const autoMatch = originalFolio.match(/^(V\d{8})(\d+)$/);
        if (autoMatch) {
          const prefix = autoMatch[1];
          const suffix = autoMatch[2];
          const newSuffix = suffix.slice(0, Math.max(0, suffix.length - 4)) + last4;
          dataToSave.folio = prefix + newSuffix;
        } else {
          dataToSave.folio = last4;
        }
        delete dataToSave.folio_manual;
      }
      // Sanitizar campos para actualización en tabla 'ventas'
      const allowedKeys = ['folio','subtotal','total','descuento_monto','requiere_factura','monto_iva','rfc','razon_social','estado','observaciones','fecha_venta'];
      const updates = {};
      allowedKeys.forEach(k => { if (typeof dataToSave[k] !== 'undefined') updates[k] = dataToSave[k]; });
      // Actualizar venta existente
      result = await salesService.updateSalesNote(selectedSale.id, updates);
    } else {
      // Crear nueva venta
      result = await salesService.createSalesNote(dataToSave);
    }

    if (result.error) {
      console.error('Error del servicio:', result.error);
      toast.error(`Error al ${selectedSale ? 'actualizar' : 'crear'} la nota de venta: ${result.error}`);
      return;
    }

    let mensajeExito = `Nota de venta ${selectedSale ? 'actualizada' : 'creada'} exitosamente`;
    if (!selectedSale && result.data?.abonoRegistrado && result.data.abonoRegistrado.monto > 0) {
      mensajeExito += `\nAbono registrado: $${result.data.abonoRegistrado.monto.toFixed(2)} (${result.data.abonoRegistrado.forma_pago})`;
      if (result.data.estado === 'completada') {
        mensajeExito += '\nLa venta ha sido marcada como completada automáticamente.';
      } else {
        const saldoPendiente = (parseFloat(result.data.total) || 0) - result.data.abonoRegistrado.monto;
        mensajeExito += `\nSaldo pendiente: $${saldoPendiente.toFixed(2)}`;
      }
    }
    
    toast.success(mensajeExito);
    setIsModalOpen(false);
    await loadInitialData();
    
    // Notificar actualización de métricas
    console.log('📊 Notificando actualización de métricas...');
    if (selectedSale) {
      const allowedKeysMetrics = ['folio','subtotal','total','descuento_monto','requiere_factura','monto_iva','rfc','razon_social','estado','observaciones','fecha_venta'];
      const updatesForMetrics = { ...selectedSale };
      allowedKeysMetrics.forEach(k => { if (typeof dataToSave[k] !== 'undefined') updatesForMetrics[k] = dataToSave[k]; });
      console.log('🔄 Notificando actualización de venta:', updatesForMetrics);
      notifySaleUpdate(updatesForMetrics);
    } else {
      console.log('🆕 Notificando creación de venta:', result.data);
      notifySaleCreated(result.data);
    }
    
  } catch (error) {
    console.error('Error saving sale:', error);
    toast.error(`Error al ${selectedSale ? 'actualizar' : 'guardar'} la nota de venta: ${error.message || 'Error desconocido'}`);
  } finally {
    setModalLoading(false);
  }
};

  const vendorOptions = [{ value: '', label: 'Todos los vendedores' }, ...vendedores.map(v => ({ value: v.id, label: `${v.nombre} ${v.apellido || ''}`.trim() }))];
  const statusOptions = [{ value: '', label: 'Todos los estados' }, { value: 'pendiente', label: 'Pendiente' }, { value: 'completada', label: 'Completada' }];
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  // Generar opciones de meses para el filtro de la tabla
  const generateMonthOptions = () => {
    const options = [{ value: '', label: 'Todos los meses' }];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Generar últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const value = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = `${monthNames[month]} ${year}`;
      options.push({ value, label });
    }
    return options;
  };
  
  const monthOptions = generateMonthOptions();
  
  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <>
      <Helmet><title>Gestión de Notas de Venta</title></Helmet>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notas de Venta</h1>
              <p className="mt-2 text-gray-600">Gestiona las notas de venta y registros de compras</p>
            </div>
            <Button onClick={handleCreateSale} className="flex items-center space-x-2"><Plus className="h-5 w-5" /><span>Nueva Nota</span></Button>
          </div>



          {/* Selector de Mes para Estadísticas */}
          <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900">Estadísticas del Mes</h3>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Mes anterior"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Mes siguiente"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-sm font-medium text-gray-500">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-sm font-medium text-gray-500">Ingresos</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(stats.completedRevenue)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-sm font-medium text-gray-500">Ingresos Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(stats.pendingRevenue)}
              </p>
            </div>
          </div>

          {/* --- FILTROS CON DISEÑO COLORIDO --- */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-lg mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">🔍 Filtros de Búsqueda</h3>
              <Button variant="ghost" onClick={clearFilters} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                <X className="h-4 w-4" />
                <span>Limpiar Filtros</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-blue-500 px-3 py-1 rounded-full">Buscar por nombre</label>
                <div className="bg-blue-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-blue-200 transition-all duration-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Cliente o vendedor..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="pl-10 bg-blue-50 border-0 text-blue-800 placeholder-blue-500 focus:ring-0 focus:outline-none shadow-none rounded-xl"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-green-500 px-3 py-1 rounded-full">Buscar por fecha</label>
                <div className="bg-green-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-green-200 transition-all duration-200">
                  <DatePicker 
                    selected={selectedDate} 
                    onChange={(date) => setSelectedDate(date)} 
                    customInput={<CustomDateInput placeholder="dd/mm/aaaa" />}
                    isClearable
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-purple-500 px-3 py-1 rounded-full">Filtrar por mes</label>
                <div className="bg-purple-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-purple-200 transition-all duration-200">
                  <Select 
                    value={monthFilter} 
                    onChange={(value) => setMonthFilter(value)} 
                    options={monthOptions}
                    placeholder=""
                    className="w-full [&>div>button]:bg-purple-50 [&>div>button]:border-0 [&>div>button]:text-purple-800 [&>div>button]:hover:bg-purple-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-purple-50 [&>div>div>div>div]:text-purple-800 [&>div>div>div>div]:hover:bg-purple-100"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-pink-500 px-3 py-1 rounded-full">Filtrar por vendedor</label>
                <div className="bg-pink-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-pink-200 transition-all duration-200">
                  <Select 
                    value={vendedorFilter} 
                    onChange={(value) => setVendedorFilter(value)} 
                    options={vendorOptions}
                    placeholder=""
                    className="w-full [&>div>button]:bg-pink-50 [&>div>button]:border-0 [&>div>button]:text-pink-800 [&>div>button]:hover:bg-pink-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-pink-50 [&>div>div>div>div]:text-pink-800 [&>div>div>div>div]:hover:bg-pink-100"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-yellow-500 px-3 py-1 rounded-full">Filtrar por estado</label>
                <div className="bg-yellow-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-yellow-200 transition-all duration-200">
                  <Select 
                    value={statusFilter} 
                    onChange={(value) => setStatusFilter(value)} 
                    options={statusOptions}
                    placeholder=""
                    className="w-full [&>div>button]:bg-yellow-50 [&>div>button]:border-0 [&>div>button]:text-yellow-800 [&>div>button]:hover:bg-yellow-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-yellow-50 [&>div>div>div>div]:text-yellow-800 [&>div>div>div>div]:hover:bg-yellow-100"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Mostrando {Math.min(salesPerPage, filteredSales.length - (currentPage - 1) * salesPerPage)} de {filteredSales.length} notas de venta (Página {currentPage} de {Math.max(1, Math.ceil(filteredSales.length / salesPerPage))})
            </p>
          </div>
          {(() => {
            const start = (currentPage - 1) * salesPerPage;
            const end = start + salesPerPage;
            const displayedSales = filteredSales.slice(start, end);
            return <SalesTable sales={displayedSales} onEdit={handleEditSale} loading={loading} />;
          })()}
          
          {/* Controles de paginación */}
          {filteredSales.length > salesPerPage && (
            <div className="mt-6 flex justify-center items-center space-x-4">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="px-4 py-2"
              >
                Anterior
              </Button>
              
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, Math.ceil(filteredSales.length / salesPerPage)) }, (_, i) => {
                  const totalPages = Math.ceil(filteredSales.length / salesPerPage);
                  let pageNumber;
                  
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      variant={currentPage === pageNumber ? "primary" : "outline"}
                      className="px-3 py-2 min-w-[40px]"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredSales.length / salesPerPage)))}
                disabled={currentPage === Math.ceil(filteredSales.length / salesPerPage)}
                variant="outline"
                className="px-4 py-2"
              >
                Siguiente
              </Button>
            </div>
          )}
          
          <NewSalesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSale} sale={selectedSale} loading={modalLoading}/>
        </div>
      </div>
    </>
  );
};

export default SalesManagement;