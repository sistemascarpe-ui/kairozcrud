import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { RefreshCw, TrendingUp, Users, Package, DollarSign, AlertTriangle, ShoppingCart, Calendar, X, CreditCard } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { salesService } from '../../services/salesService';
import { inventoryService } from '../../services/inventoryService';
import { customerService } from '../../services/customerService';
import { abonosService } from '../../services/abonosService';
import { useAuth } from '../../contexts/AuthContext';
import { useMetrics } from '../../contexts/MetricsContext';
import { useTopProducts } from '../../hooks/useOptimizedSales';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import MetricCard from './components/MetricCard';
import MonthlyGoalChart from './components/MonthlyGoalChart';
import InventoryChart from './components/InventoryChart';
import TopProductsList from './components/TopProductsList';
import SalesByVendorList from './components/SalesByVendorList';
import VendorPerformanceDetail from './components/VendorPerformanceDetail';
import OutOfStockAlert from './components/OutOfStockAlert';
import TopBrandsList from './components/TopBrandsList';
import TopCompaniesList from './components/TopCompaniesList';

const MetricsManagement = () => {
  const { user } = useAuth();
  const { refreshTrigger } = useMetrics();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para filtros de fecha
  const [dateFilter, setDateFilter] = useState('month'); // 'all', 'month', 'specific'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [periodLabel, setPeriodLabel] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [allSalesData, setAllSalesData] = useState([]);
  const [allCustomersData, setAllCustomersData] = useState([]);
  
  // Estado para filtro de mes en productos más vendidos
  const [topProductsMonth, setTopProductsMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Estados para métricas reales
  const [metricsData, setMetricsData] = useState({
    sales: {
      total: 0,
      completed: 0,
      pending: 0,
      revenue: 0,
      completedRevenue: 0,
      pendingRevenue: 0,
      averageTicket: 0
    },
    inventory: {
      totalProducts: 0,
      totalFrames: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      lowStockProducts: []
    },
    customers: {
      total: 0,
      new: 0,
      active: 0,
      recentCustomers: []
    },
    debtPayments: {
      totalPagos: 0,
      cantidadPagos: 0,
      totalAdeudos: 0,
      cantidadAdeudos: 0,
      totalPagosUltimoMes: 0,
      cantidadPagosUltimoMes: 0,
      porcentajeRecuperado: 0
    }
  });

  const [additionalMetrics, setAdditionalMetrics] = useState({
    topProducts: [],
    salesByVendor: [],
    monthlyTrends: []
  });

  const [monthComparison, setMonthComparison] = useState({
    prevMonthLabel: '',
    prevSalesTotal: 0,
    prevRevenueTotal: 0,
    salesChangePct: 0,
    revenueChangePct: 0
  });

  const [chartData, setChartData] = useState({
    inventoryStatus: []
  });

  // Hook optimizado para productos más vendidos
  const { data: topProductsData, isLoading: topProductsLoading, error: topProductsError } = useTopProducts(10, topProductsMonth);

  useEffect(() => {
    console.log('🔄 useEffect triggered - refreshTrigger:', refreshTrigger);
    loadMetricsData();
  }, [refreshTrigger]);
  
  useEffect(() => {
    // Filtrar métricas cuando cambien los filtros
    filterMetrics();
  }, [dateFilter, selectedMonth, selectedDate, allSalesData, allCustomersData]);

  const loadMetricsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSalesMetrics(),
        loadInventoryMetrics(),
        loadCustomerMetrics(),
        loadDebtPaymentsMetrics(),
        loadAdditionalMetrics()
      ]);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthRange = (ym) => {
    if (!ym) return { start: null, end: null };
    const [year, month] = ym.split('-').map(n => parseInt(n, 10));
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const getPrevMonthValue = (ym) => {
    const [year, month] = ym.split('-').map(n => parseInt(n, 10));
    const prevDate = new Date(year, month - 2, 1); // month-2 because Date expects 0-indexed
    const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    return prevYM;
  };

  const loadComparisonForMonth = async (ym) => {
    try {
      const prevYM = getPrevMonthValue(ym);
      const { start: pStart, end: pEnd } = getMonthRange(prevYM);
      const { data: prevData } = await salesService.getSalesMetrics(pStart, pEnd);
      const prevComputed = await computeSalesMetricsForPeriod(prevData || [], pStart, pEnd);
      const prevSalesTotal = prevComputed.total || 0;
      const prevRevenueTotal = prevComputed.revenue || 0;

      // Totales actuales ya calculados con el mismo criterio (pagos del período)
      const currSalesTotal = metricsData.sales.total || 0;
      const currRevenueTotal = metricsData.sales.revenue || 0;

      const salesChangePct = prevSalesTotal > 0 ? ((currSalesTotal - prevSalesTotal) / prevSalesTotal) * 100 : (currSalesTotal > 0 ? 100 : 0);
      const revenueChangePct = prevRevenueTotal > 0 ? ((currRevenueTotal - prevRevenueTotal) / prevRevenueTotal) * 100 : (currRevenueTotal > 0 ? 100 : 0);

      setMonthComparison({
        prevMonthLabel: pStart?.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) || '',
        prevSalesTotal,
        prevRevenueTotal,
        salesChangePct,
        revenueChangePct
      });
    } catch (e) {
      console.error('Error loading comparison metrics:', e);
    }
  };

  const loadSalesMetrics = async () => {
    try {
      console.log('💰 Cargando métricas de ventas...');
      // 1) Cargar dataset completo (para vistas 'all' y 'specific')
      const { data: sales, error } = await salesService.getSalesNotes();
      
      if (error) {
        console.error('Error loading sales:', error);
        return;
      }

      // Guardar todos los datos para filtrar después
      setAllSalesData(sales || []);
      
      // 2) Calcular métricas iniciales usando el mes actual desde backend (evitar cargar todas)
      const { start, end } = getMonthRange(selectedMonth);
      const { data: monthData } = await salesService.getSalesMetrics(start, end);
      const monthLabel = start?.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) || '';
      setPeriodLabel(monthLabel);
      await calculateSalesMetrics(monthData || [], start, end);
      await loadComparisonForMonth(selectedMonth);
    } catch (error) {
      console.error('Error in loadSalesMetrics:', error);
    }
  };
  
  // Computa métricas de ventas para un período (si se proporcionan fechas)
  const computeSalesMetricsForPeriod = async (sales, periodStart = null, periodEnd = null) => {
    const totalSales = sales?.length || 0;
    const completedSales = sales?.filter(sale => sale.estado === 'completada').length || 0;
    const pendingSales = sales?.filter(sale => sale.estado === 'pendiente').length || 0;

    let completedRevenue = sales?.filter(sale => sale.estado === 'completada')
      .reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0) || 0;

    let totalPagosAdeudos = 0;
    let ventasCompletadasPorPagos = 0;
    let ingresosVentasCompletadasPorPagos = 0;
    const ventasPendientes = sales?.filter(sale => sale.estado === 'pendiente') || [];

    for (const venta of ventasPendientes) {
      try {
        let abonosResp;
        if (periodStart && periodEnd) {
          abonosResp = await abonosService.getAbonosByVentaIdEnRango(venta.id, periodStart, periodEnd);
        } else {
          abonosResp = await abonosService.getAbonosByVentaId(venta.id);
        }
        const abonos = abonosResp?.data || [];
        const pagosVenta = abonos.reduce((sum, abono) => sum + (parseFloat(abono.monto) || 0), 0);
        totalPagosAdeudos += pagosVenta;

        if (pagosVenta >= parseFloat(venta.total)) {
          ventasCompletadasPorPagos++;
          ingresosVentasCompletadasPorPagos += parseFloat(venta.total);
        }
      } catch (error) {
        console.error(`Error getting payments for sale ${venta.id}:`, error);
      }
    }

    const totalRevenue = completedRevenue + totalPagosAdeudos;
    const totalVentasPendientes = ventasPendientes.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    const pendingRevenue = Math.max(0, totalVentasPendientes - totalPagosAdeudos);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      total: totalSales,
      completed: completedSales + ventasCompletadasPorPagos,
      pending: Math.max(0, pendingSales - ventasCompletadasPorPagos),
      revenue: totalRevenue,
      completedRevenue: completedRevenue + ingresosVentasCompletadasPorPagos,
      pendingRevenue,
      averageTicket
    };
  };

  const calculateSalesMetrics = async (sales, periodStart = null, periodEnd = null) => {
    const computed = await computeSalesMetricsForPeriod(sales, periodStart, periodEnd);
    setMetricsData(prev => ({
      ...prev,
      sales: computed
    }));
  };

  const loadInventoryMetrics = async () => {
    try {
      console.log('📦 Cargando métricas de inventario...');
      const { data: inventory, error } = await inventoryService.getInventoryMetrics();
      
      if (error) {
        console.error('Error loading inventory:', error);
        return;
      }

      const { data: inventoryChartData, error: inventoryChartError } = await inventoryService.getInventoryStatus();
      if (inventoryChartError) {
        console.error('Error loading inventory chart data:', inventoryChartError);
      }

      const chartDataToSet = {
        inventoryStatus: inventoryChartData?.chartData || []
      };
      
      setChartData(chartDataToSet);

      setMetricsData(prev => ({
        ...prev,
        inventory: {
          totalProducts: inventory?.totalProducts || 0,
          totalFrames: inventory?.totalFrames || 0,
          lowStock: inventory?.lowStock || 0,
          outOfStock: inventory?.outOfStock || 0,
          totalValue: inventory?.totalValue || 0,
          lowStockProducts: inventory?.lowStockProducts || []
        }
      }));
    } catch (error) {
      console.error('Error in loadInventoryMetrics:', error);
    }
  };

  const loadCustomerMetrics = async () => {
    try {
      console.log('👥 Cargando métricas de clientes...');
      const { data: customers, error } = await customerService.getCustomers();
      
      if (error) {
        console.error('Error loading customers:', error);
        return;
      }

      // Guardar todos los datos para filtrar después
      setAllCustomersData(customers || []);
      
      // Calcular métricas iniciales
      calculateCustomerMetrics(customers || []);
    } catch (error) {
      console.error('Error in loadCustomerMetrics:', error);
    }
  };
  
  const calculateCustomerMetrics = (customers) => {
    setMetricsData(prev => ({
      ...prev,
      customers: {
        total: customers?.length || 0,
        new: 0,
        active: customers?.filter(c => c.activo).length || 0,
        recentCustomers: []
      }
    }));
  };

  const loadDebtPaymentsMetrics = async () => {
    try {
      console.log('💳 Cargando métricas de pagos de adeudos...');
      const { data: debtPaymentsData, error } = await abonosService.getEstadisticasPagosAdeudos();
      
      if (error) {
        console.error('Error loading debt payments:', error);
        return;
      }

      // Calcular adeudos pendientes reales (total - pagos recibidos)
      const adeudosPendientesReales = Math.max(0, (debtPaymentsData?.totalAdeudos || 0) - (debtPaymentsData?.totalPagos || 0));

      setMetricsData(prev => ({
        ...prev,
        debtPayments: {
          totalPagos: debtPaymentsData?.totalPagos || 0,
          cantidadPagos: debtPaymentsData?.cantidadPagos || 0,
          totalAdeudos: adeudosPendientesReales, // Ahora muestra el saldo real
          cantidadAdeudos: debtPaymentsData?.cantidadAdeudos || 0,
          totalPagosUltimoMes: debtPaymentsData?.totalPagosUltimoMes || 0,
          cantidadPagosUltimoMes: debtPaymentsData?.cantidadPagosUltimoMes || 0,
          porcentajeRecuperado: debtPaymentsData?.porcentajeRecuperado || 0
        }
      }));
    } catch (error) {
      console.error('Error in loadDebtPaymentsMetrics:', error);
    }
  };

  const loadAdditionalMetrics = async () => {
    try {
      console.log('🔄 Iniciando carga de métricas adicionales...');
      
      // Cargar métricas adicionales con mejor manejo de errores
      console.log('🏆 Cargando productos más vendidos...');
      const { data: topProductsData, error: topProductsError } = await salesService.getBestSellingProducts();
      if (topProductsError) {
        console.error('Error loading top products:', topProductsError);
      }

      console.log('👨‍💼 Cargando ventas por vendedor...');
      const { data: salesByVendorData, error: salesByVendorError } = await salesService.getSalesByVendor();
      if (salesByVendorError) {
        console.error('Error loading sales by vendor:', salesByVendorError);
      }

      setAdditionalMetrics({
        topProducts: topProductsData || [],
        salesByVendor: salesByVendorData || [],
        monthlyTrends: []
      });

      console.log('✅ Métricas adicionales cargadas exitosamente');
    } catch (error) {
      console.error('Error in loadAdditionalMetrics:', error);
    }
  };

  const filterMetrics = async () => {
    let filteredSales = [...allSalesData];
    let filteredCustomers = [...allCustomersData];
    
    if (dateFilter === 'month' && selectedMonth) {
      // Obtener datos del mes desde backend (aplicar gte/lte con ISO)
      const { start, end } = getMonthRange(selectedMonth);
      const { data: monthData } = await salesService.getSalesMetrics(start, end);
      filteredSales = monthData || [];
      const monthLabel = start?.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) || '';
      setPeriodLabel(monthLabel);
      await loadComparisonForMonth(selectedMonth);
      
      filteredCustomers = allCustomersData.filter(customer => {
        const customerDate = new Date(customer.created_at);
        const customerYearMonth = `${customerDate.getFullYear()}-${String(customerDate.getMonth() + 1).padStart(2, '0')}`;
        return customerYearMonth === selectedMonth;
      });
    } else if (dateFilter === 'specific' && selectedDate) {
      // Filtrar por fecha específica
      const targetDate = selectedDate.toISOString().split('T')[0];
      
      filteredSales = allSalesData.filter(sale => {
        const saleDateUTC = new Date(sale.created_at);
        const saleDate = new Date(saleDateUTC.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        const saleDateStr = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
        return saleDateStr === targetDate;
      });
      
      filteredCustomers = allCustomersData.filter(customer => {
        const customerDateUTC = new Date(customer.created_at);
        const customerDate = new Date(customerDateUTC.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        const customerDateStr = `${customerDate.getFullYear()}-${String(customerDate.getMonth() + 1).padStart(2, '0')}-${String(customerDate.getDate()).padStart(2, '0')}`;
        return customerDateStr === targetDate;
      });
      const specificLabel = selectedDate?.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) || '';
      setPeriodLabel(specificLabel);
    } else {
      setPeriodLabel('Todas las fechas');
    }
    
    // Recalcular métricas con datos filtrados (limitando pagos al período cuando aplique)
    if (dateFilter === 'month' && selectedMonth) {
      const { start, end } = getMonthRange(selectedMonth);
      await calculateSalesMetrics(filteredSales, start, end);
    } else {
      await calculateSalesMetrics(filteredSales);
    }
    calculateCustomerMetrics(filteredCustomers);
  };
  
  const generateMonthOptions = () => {
    const options = [{ value: '', label: 'Seleccionar mes' }];
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
  
  const handleShowAllDates = () => {
    setDateFilter('all');
    setSelectedMonth('');
    setSelectedDate(null);
  };

  // ===== Pruebas lógicas con datos de muestra (solo en desarrollo) =====
  const computeSalesMetricsWithProvidedPayments = (sales, paymentsByVentaId, periodStart = null, periodEnd = null) => {
    const totalSales = sales?.length || 0;
    const completedSales = sales?.filter(sale => sale.estado === 'completada').length || 0;
    const pendingSales = sales?.filter(sale => sale.estado === 'pendiente').length || 0;

    let completedRevenueBase = sales?.filter(sale => sale.estado === 'completada')
      .reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0) || 0;

    let totalPagosAdeudos = 0;
    let ventasCompletadasPorPagos = 0;
    let ingresosVentasCompletadasPorPagos = 0;
    const ventasPendientes = sales?.filter(sale => sale.estado === 'pendiente') || [];

    const inRange = (fecha) => {
      if (!periodStart || !periodEnd) return true;
      const d = fecha instanceof Date ? fecha : new Date(fecha);
      return d >= periodStart && d <= periodEnd;
    };

    for (const venta of ventasPendientes) {
      const pagos = paymentsByVentaId[venta.id] || [];
      const pagosEnPeriodo = pagos.filter(p => inRange(p.fecha_abono));
      const sumPagos = pagosEnPeriodo.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
      totalPagosAdeudos += sumPagos;

      if (sumPagos >= parseFloat(venta.total)) {
        ventasCompletadasPorPagos++;
        ingresosVentasCompletadasPorPagos += parseFloat(venta.total);
      }
    }

    const revenue = completedRevenueBase + totalPagosAdeudos;
    const totalPendientes = ventasPendientes.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    const pendingRevenue = Math.max(0, totalPendientes - totalPagosAdeudos);
    const averageTicket = totalSales > 0 ? revenue / totalSales : 0;

    return {
      total: totalSales,
      completed: completedSales + ventasCompletadasPorPagos,
      pending: Math.max(0, pendingSales - ventasCompletadasPorPagos),
      revenue,
      completedRevenue: completedRevenueBase + ingresosVentasCompletadasPorPagos,
      pendingRevenue,
      averageTicket
    };
  };

  const runMetricsChangeTests = () => {
    // Construir datos de muestra: mes actual y mes previo
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    currentEnd.setHours(23, 59, 59, 999);

    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    prevEnd.setHours(23, 59, 59, 999);

    // Ventas del mes actual
    const ventasActual = [
      { id: 1, estado: 'completada', total: 1000, created_at: currentStart },
      { id: 2, estado: 'pendiente', total: 800, created_at: currentStart },
      { id: 3, estado: 'pendiente', total: 500, created_at: currentStart }
    ];

    // Pagos del mes actual
    const pagosActual = {
      2: [ { monto: 300, fecha_abono: new Date(currentStart.getTime() + 3*86400000) } ],
      3: [ { monto: 500, fecha_abono: new Date(currentStart.getTime() + 5*86400000) } ]
    };

    // Ventas del mes previo
    const ventasPrevio = [
      { id: 10, estado: 'completada', total: 900, created_at: prevStart },
      { id: 11, estado: 'pendiente', total: 600, created_at: prevStart }
    ];

    // Pagos del mes previo
    const pagosPrevio = {
      11: [ { monto: 200, fecha_abono: new Date(prevStart.getTime() + 8*86400000) } ]
    };

    const resActual = computeSalesMetricsWithProvidedPayments(ventasActual, pagosActual, currentStart, currentEnd);
    const resPrevio = computeSalesMetricsWithProvidedPayments(ventasPrevio, pagosPrevio, prevStart, prevEnd);

    const expectedActual = {
      total: 3,
      completed: 2,
      pending: 1,
      revenue: 1800,
      completedRevenue: 1500,
      pendingRevenue: 500,
      averageTicket: 600
    };

    const expectedPrevio = {
      total: 2,
      completed: 1,
      pending: 1,
      revenue: 1100,
      completedRevenue: 900,
      pendingRevenue: 400,
      averageTicket: 550
    };

    const salesChangePct = expectedPrevio.total > 0 ? ((expectedActual.total - expectedPrevio.total) / expectedPrevio.total) * 100 : 0;
    const revenueChangePct = expectedPrevio.revenue > 0 ? ((expectedActual.revenue - expectedPrevio.revenue) / expectedPrevio.revenue) * 100 : 0;

    const obtainedSalesChangePct = resPrevio.total > 0 ? ((resActual.total - resPrevio.total) / resPrevio.total) * 100 : 0;
    const obtainedRevenueChangePct = resPrevio.revenue > 0 ? ((resActual.revenue - resPrevio.revenue) / resPrevio.revenue) * 100 : 0;

    console.group('[Pruebas métricas: cambio en ventas e ingresos]');
    console.table({
      'Esperado (Actual)': expectedActual,
      'Obtenido (Actual)': resActual,
      'Esperado (Previo)': expectedPrevio,
      'Obtenido (Previo)': resPrevio
    });
    console.table({
      'Cambio ventas esperado %': Number(salesChangePct.toFixed(1)),
      'Cambio ventas obtenido %': Number(obtainedSalesChangePct.toFixed(1)),
      'Cambio ingresos esperado %': Number(revenueChangePct.toFixed(1)),
      'Cambio ingresos obtenido %': Number(obtainedRevenueChangePct.toFixed(1))
    });
    console.groupEnd();
  };

  useEffect(() => {
    // Ejecutar pruebas solo en modo desarrollo
    try {
      const mode = import.meta?.env?.MODE;
      if (mode && mode !== 'production') {
        runMetricsChangeTests();
      }
    } catch (e) {
      // Ignorar en caso de entornos sin import.meta
    }
  }, []);
  


  return (
    <>
      <Helmet>
        <title>Métricas y Análisis - Kairoz Rocket</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Métricas y Análisis" 
          subtitle="Panel de control y estadísticas del negocio"
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtros de Fecha para Métricas */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-lg mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6">📊 Filtrar Estadísticas por Fecha</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-blue-500 px-3 py-1 rounded-full">Filtrar por mes</label>
                <div className="bg-blue-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-blue-200 transition-all duration-200">
                  <Select
                    value={selectedMonth}
                    onChange={(value) => {
                      setSelectedMonth(value);
                      setDateFilter(value ? 'month' : 'all');
                      setSelectedDate(null);
                    }}
                    options={generateMonthOptions()}
                    placeholder=""
                    className="w-full [&>div>button]:bg-blue-50 [&>div>button]:border-0 [&>div>button]:text-blue-800 [&>div>button]:hover:bg-blue-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-blue-50 [&>div>div>div>div]:text-blue-800 [&>div>div>div>div]:hover:bg-blue-100"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-green-500 px-3 py-1 rounded-full">Filtrar por fecha específica</label>
                <div className="bg-green-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-green-200 transition-all duration-200">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setDateFilter(date ? 'specific' : 'all');
                      setSelectedMonth('');
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar fecha"
                    className="w-full px-3 py-2 bg-green-50 border-0 text-green-800 placeholder-green-500 focus:ring-0 focus:outline-none shadow-none rounded-xl"
                    isClearable
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-purple-500 px-3 py-1 rounded-full">Mostrar todas</label>
                <div className="bg-purple-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-purple-200 transition-all duration-200">
                  <Button
                    onClick={handleShowAllDates}
                    variant="outline"
                    className="w-full border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:outline-none shadow-none text-purple-700 hover:text-purple-900 font-semibold"
                  >
                    Mostrar Todas las Fechas
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white bg-yellow-500 px-3 py-1 rounded-full">Estado actual</label>
                <div className="bg-yellow-100 rounded-2xl p-3 shadow-lg">
                  <div className="text-sm text-yellow-800 font-medium">
                    {dateFilter === 'all' && <span className="flex items-center gap-2">✓ Mostrando todas las fechas</span>}
                    {dateFilter === 'month' && selectedMonth && <span className="flex items-center gap-2">✓ Filtrado por mes</span>}
                    {dateFilter === 'specific' && selectedDate && <span className="flex items-center gap-2">✓ Filtrado por fecha</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Filtradas: Ventas, Ingresos y Clientes */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-1">📊 Estadísticas de ventas — {periodLabel}</h2>
            <p className="text-sm text-gray-500 mb-6">Vista filtrada por período seleccionado</p>

            {/* Comparativa vs mes anterior */}
            {dateFilter === 'month' && selectedMonth && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-indigo-700 font-medium mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Comparativa vs {monthComparison.prevMonthLabel}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cambio en ventas</span>
                    <span className={`font-semibold ${monthComparison.salesChangePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{monthComparison.salesChangePct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cambio en ingresos</span>
                    <span className={`font-semibold ${monthComparison.revenueChangePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{monthComparison.revenueChangePct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Métricas principales filtradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Ventas Totales"
              value={metricsData.sales.total}
              icon={ShoppingCart}
              color="blue"
              loading={loading}
            />
            <MetricCard
              title="Ingresos Reales"
              value={`$${metricsData.sales.revenue.toLocaleString()}`}
              icon={DollarSign}
              color="green"
              loading={loading}
              subtitle="Completadas + Pagos recibidos"
            />
            <MetricCard
              title="Clientes Totales"
              value={metricsData.customers.total}
              icon={Users}
              color="orange"
              loading={loading}
            />
            <MetricCard
              title="Pagos de Adeudos"
              value={`$${metricsData.debtPayments.totalPagos.toLocaleString()}`}
              icon={CreditCard}
              color="purple"
              loading={loading}
              subtitle={`${metricsData.debtPayments.cantidadPagos} pagos registrados`}
            />
          </div>

            {/* Resumen de Ventas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Ventas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ventas Completadas</span>
                  <span className="font-semibold text-green-600">${metricsData.sales.completedRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo Pendiente Real</span>
                  <span className="font-semibold text-yellow-600">${metricsData.sales.pendingRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Ingresos (Completadas + Pagos)</span>
                  <span className="font-semibold text-blue-600">${metricsData.sales.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Resumen de Pagos de Adeudos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Pagos de Adeudos</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pagos Recibidos</span>
                  <span className="font-semibold text-green-600">${metricsData.debtPayments.totalPagos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo Pendiente Real</span>
                  <span className="font-semibold text-red-600">${metricsData.debtPayments.totalAdeudos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pagos del Último Mes</span>
                  <span className="font-semibold text-blue-600">${metricsData.debtPayments.totalPagosUltimoMes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Porcentaje Recuperado</span>
                  <span className="font-semibold text-purple-600">{metricsData.debtPayments.porcentajeRecuperado.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas de Inventario y Stock Agotado */}
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg border border-purple-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📦 Inventario</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alertas de Inventario */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas de Inventario</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-600">Tipos de Armazones</span>
                  <span className="font-semibold text-purple-600">{metricsData.inventory.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Cantidad Total de Armazones</span>
                  <span className="font-semibold text-blue-600">{metricsData.inventory.totalFrames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Sin Stock</span>
                  <span className="font-semibold text-red-600">{metricsData.inventory.outOfStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Total de Mercancía</span>
                  <span className="font-semibold text-green-600">${metricsData.inventory.totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Stock Agotado */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Package className="h-5 w-5 text-red-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Stock Agotado</h3>
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  {metricsData.inventory.lowStockProducts.length > 0 ? (
                    <div className="space-y-3">
                      {metricsData.inventory.lowStockProducts.map((product, index) => (
                        <OutOfStockAlert key={product.id || index} product={product} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No hay productos sin stock</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Mensual - Sección completa */}
          <div className="mb-8">
            <MonthlyGoalChart refreshTrigger={refreshTrigger} />
          </div>

          {/* Charts Section */}
          <div className="space-y-8 mb-8">
            {/* Inventory Chart - Enhanced Design */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-white border-b border-gray-100 px-8 py-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Estado del Inventario</h3>
                  <p className="text-sm text-gray-600">Distribución actual de productos en stock</p>
                </div>
              </div>
              <div className="p-8">
                 <div className="h-96 flex items-center justify-center">
                   <InventoryChart 
                     data={chartData.inventoryStatus} 
                     loading={loading}
                   />
                 </div>
               </div>
            </div>
          </div>

          {/* Rendimiento Detallado por Vendedor - Sección completa */}
          <div className="mb-8">
            <VendorPerformanceDetail />
          </div>

            {/* Productos Más Vendidos */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <TrendingUp className="h-7 w-7" />
                      Top Productos Más Vendidos
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Los armazones favoritos de tus clientes
                    </p>
                </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Filtro de mes */}
                    <div className="min-w-[200px]">
                      <select
                        value={topProductsMonth}
                        onChange={(e) => setTopProductsMonth(e.target.value)}
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
                        <option value="" className="bg-blue-600 text-white">Todos los meses</option>
                        {generateMonthOptions().slice(1).map(option => (
                          <option key={option.value} value={option.value} className="bg-blue-600 text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
            </div>

                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-white/30">
                      <span className="text-sm font-semibold text-white">
                        {topProductsData?.data?.length || 0} productos
                      </span>
              </div>
                  </div>
                </div>
              </div>
              <TopProductsList products={topProductsData?.data || []} />
            </div>
          </div>

          {/* Marcas Más Vendidas */}
          <div className="mb-8">
            <TopBrandsList />
          </div>

          {/* Empresas que Más Compran */}
          <div className="mb-8">
            <TopCompaniesList />
          </div>

        </main>
      </div>
    </>
  );
};

export default MetricsManagement;
