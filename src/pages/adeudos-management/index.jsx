import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { DollarSign, Search, Filter, AlertCircle, CheckCircle, Calendar, User, Phone, Plus, History, Edit, X } from 'lucide-react';
import { salesService } from '../../services/salesService';
import { abonosService } from '../../services/abonosService';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';

const AdeudosManagement = () => {
  const [loading, setLoading] = useState(true);
  const [adeudos, setAdeudos] = useState([]);
  const [filteredAdeudos, setFilteredAdeudos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha_desc'); // fecha_desc, fecha_asc, monto_desc, monto_asc
  const [filterByDays, setFilterByDays] = useState('all'); // all, 7days, 15days, 30days, 60days
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAdeudo, setSelectedAdeudo] = useState(null);
  const [showViewNoteModal, setShowViewNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [selectedVentaForAbono, setSelectedVentaForAbono] = useState(null);
  const [abonoData, setAbonoData] = useState({ monto: '', observaciones: '' });
  const [historialAbonos, setHistorialAbonos] = useState([]);
  const [editingAbonoId, setEditingAbonoId] = useState(null);
  const [editAbonoData, setEditAbonoData] = useState({ monto: '', observaciones: '', forma_pago: 'efectivo' });

  useEffect(() => {
    loadAdeudos();
  }, []);

  useEffect(() => {
    filterAndSortAdeudos();
  }, [adeudos, searchTerm, sortBy, filterByDays]);

  const loadAdeudos = async () => {
    setLoading(true);
    try {
      const { data: sales, error } = await salesService.getSalesNotes();
      
      if (error) {
        toast.error('Error al cargar adeudos');
        console.error('Error loading adeudos:', error);
        return;
      }

      // Filtrar solo ventas pendientes
      const pendingSales = sales?.filter(sale => sale.estado === 'pendiente') || [];
      
      setAdeudos(pendingSales);
      setFilteredAdeudos(pendingSales);
    } catch (error) {
      toast.error('Error al cargar adeudos');
      console.error('Error in loadAdeudos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAdeudos = () => {
    let filtered = [...adeudos];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(adeudo => {
        const searchLower = searchTerm.toLowerCase();
        return (
          adeudo.folio?.toLowerCase().includes(searchLower) ||
          adeudo.cliente?.nombre?.toLowerCase().includes(searchLower) ||
          adeudo.cliente?.telefono?.includes(searchTerm)
        );
      });
    }

    // Filtrar por días
    if (filterByDays !== 'all') {
      const today = new Date();
      const daysLimit = parseInt(filterByDays);
      
      filtered = filtered.filter(adeudo => {
        const saleDate = new Date(adeudo.fecha_venta || adeudo.created_at);
        const daysDiff = Math.floor((today - saleDate) / (1000 * 60 * 60 * 24));
        return daysDiff >= daysLimit;
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'fecha_desc':
          return new Date(b.fecha_venta || b.created_at) - new Date(a.fecha_venta || a.created_at);
        case 'fecha_asc':
          return new Date(a.fecha_venta || a.created_at) - new Date(b.fecha_venta || b.created_at);
        case 'monto_desc':
          return parseFloat(b.total) - parseFloat(a.total);
        case 'monto_asc':
          return parseFloat(a.total) - parseFloat(b.total);
        default:
          return 0;
      }
    });

    setFilteredAdeudos(filtered);
  };

  const handleMarcarComoPagado = (adeudo) => {
    setSelectedAdeudo(adeudo);
    setShowConfirmModal(true);
  };

  const confirmMarcarComoPagado = async () => {
    try {
      // Pasar todos los datos de la venta para preservar los montos
      const ventaData = {
        estado: 'completada',
        // Preservar todos los datos importantes de la venta
        precio_armazon: selectedAdeudo.precio_armazon || 0,
        precio_micas: selectedAdeudo.precio_micas || 0,
        subtotal: selectedAdeudo.subtotal || 0,
        total: selectedAdeudo.total || 0,
        descuento_armazon_monto: selectedAdeudo.descuento_armazon_monto || 0,
        descuento_micas_monto: selectedAdeudo.descuento_micas_monto || 0,
        descuento_monto: selectedAdeudo.descuento_monto || 0,
        monto_iva: selectedAdeudo.monto_iva || 0,
        requiere_factura: selectedAdeudo.requiere_factura || false,
        rfc: selectedAdeudo.rfc || null,
        razon_social: selectedAdeudo.razon_social || null,
        observaciones: selectedAdeudo.observaciones || null
      };

      const { error } = await salesService.updateSalesNote(selectedAdeudo.id, ventaData);

      if (error) {
        toast.error('Error al actualizar el estado');
        return;
      }

      toast.success('Venta marcada como pagada');
      setShowConfirmModal(false);
      setSelectedAdeudo(null);
      loadAdeudos();
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error('Error:', error);
    }
  };

  const cancelMarcarComoPagado = () => {
    setShowConfirmModal(false);
    setSelectedAdeudo(null);
  };

  const handleVerNota = (adeudo) => {
    setSelectedNote(adeudo);
    setShowViewNoteModal(true);
  };

  const closeViewNoteModal = () => {
    setShowViewNoteModal(false);
    setSelectedNote(null);
  };

  const handleRegistrarAbono = (adeudo) => {
    setSelectedVentaForAbono(adeudo);
    setAbonoData({ monto: '', observaciones: '', forma_pago: 'efectivo' });
    setShowAbonoModal(true);
  };

  const handleVerHistorial = async (adeudo) => {
    setSelectedVentaForAbono(adeudo);
    try {
      const { data, error } = await abonosService.getAbonosByVentaId(adeudo.id);
      if (error) {
        toast.error('Error al cargar historial de abonos');
        return;
      }
      setHistorialAbonos(data || []);
      setShowHistorialModal(true);
    } catch (error) {
      toast.error('Error al cargar historial de abonos');
    }
  };

  const handleCrearAbono = async () => {
    if (!abonoData.monto || parseFloat(abonoData.monto) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (parseFloat(abonoData.monto) > selectedVentaForAbono.saldoPendiente) {
      toast.error('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      const { data, error } = await abonosService.createAbono({
        venta_id: selectedVentaForAbono.id,
        monto: parseFloat(abonoData.monto),
        observaciones: abonoData.observaciones || null,
        forma_pago: abonoData.forma_pago
      });

      if (error) {
        toast.error('Error al registrar abono');
        return;
      }

      toast.success('Abono registrado correctamente');
      setShowAbonoModal(false);
      setAbonoData({ monto: '', observaciones: '' });
      
      // Verificar si la venta se completó automáticamente
      const { data: verificacion } = await abonosService.verificarYCompletarVenta(selectedVentaForAbono.id);
      
      if (verificacion?.completada) {
        toast.success('¡Venta completada automáticamente!');
      }
      
      // Recargar adeudos
      loadAdeudos();
    } catch (error) {
      toast.error('Error al registrar abono');
    }
  };

  const closeAbonoModal = () => {
    setShowAbonoModal(false);
    setSelectedVentaForAbono(null);
    setAbonoData({ monto: '', observaciones: '' });
  };

  const closeHistorialModal = () => {
    setShowHistorialModal(false);
    setSelectedVentaForAbono(null);
    setHistorialAbonos([]);
    setEditingAbonoId(null);
    setEditAbonoData({ monto: '', observaciones: '' });
  };
  

  
  const handleEditAbono = (abono) => {
    setEditingAbonoId(abono.id);
    setEditAbonoData({ 
      monto: abono.monto, 
      observaciones: abono.observaciones || '',
      forma_pago: abono.forma_pago || 'efectivo'
    });
  };
  
  const handleSaveEditAbono = async () => {
    if (!editingAbonoId) return;
    
    try {
      const { data, error } = await abonosService.updateAbono(editingAbonoId, editAbonoData);
      
      if (error) {
        toast.error('Error al actualizar el abono');
        return;
      }
      
      // Actualizar la lista de abonos
      const updatedHistorial = historialAbonos.map(abono => 
        abono.id === editingAbonoId ? { ...abono, ...editAbonoData } : abono
      );
      
      setHistorialAbonos(updatedHistorial);
      setEditingAbonoId(null);
      setEditAbonoData({ monto: '', observaciones: '' });
      
      // Recargar los adeudos para actualizar los saldos
      loadAdeudos();
      
      toast.success('Abono actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el abono');
    }
  };
  
  const handleCancelEditAbono = () => {
    setEditingAbonoId(null);
    setEditAbonoData({ monto: '', observaciones: '', forma_pago: 'efectivo' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatPaymentMethod = (formaPago) => {
    const methods = {
      'efectivo': 'Efectivo',
      'tarjeta_debito': 'Tarjeta de Débito',
      'tarjeta_credito': 'Tarjeta de Crédito',
      'transferencia': 'Transferencia'
    };
    return methods[formaPago] || formaPago;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysOverdue = (dateString) => {
    const saleDate = new Date(dateString);
    const today = new Date();
    
    // Normalizar las fechas para comparar solo día, mes y año (sin horas)
    const saleDateNormalized = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const daysDiff = Math.floor((todayNormalized - saleDateNormalized) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const getOverdueColor = (days) => {
    if (days < 7) return 'text-green-600 bg-green-100';
    if (days < 30) return 'text-yellow-600 bg-yellow-100';
    if (days < 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const totalAdeudos = filteredAdeudos.reduce((sum, adeudo) => sum + parseFloat(adeudo.total || 0), 0);

  return (
    <>
      <Helmet>
        <title>Adeudos Pendientes - Kairoz Rocket</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Header
          title="Gestión de Adeudos"
          subtitle="Control de ventas pendientes de pago"
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Estadísticas Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Adeudos</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredAdeudos.length}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monto Total Pendiente</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAdeudos)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  icon={Search}
                  placeholder="Buscar por folio, cliente o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: 'fecha_desc', label: 'Más recientes' },
                    { value: 'fecha_asc', label: 'Más antiguos' },
                    { value: 'monto_desc', label: 'Mayor monto' },
                    { value: 'monto_asc', label: 'Menor monto' }
                  ]}
                />
              </div>

              <div>
                <Select
                  value={filterByDays}
                  onChange={setFilterByDays}
                  options={[
                    { value: 'all', label: 'Todos los días' },
                    { value: '7', label: 'Más de 7 días' },
                    { value: '15', label: 'Más de 15 días' },
                    { value: '30', label: 'Más de 30 días' },
                    { value: '60', label: 'Más de 60 días' }
                  ]}
                />
              </div>

              <div>
                <Button
                  onClick={loadAdeudos}
                  iconName="RefreshCw"
                  variant="outline"
                  className="w-full"
                >
                  Actualizar
                </Button>
              </div>
            </div>
          </div>

          {/* Tabla de Adeudos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Venta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Días Pendiente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAdeudos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p className="text-gray-500 text-lg font-medium">¡No hay adeudos pendientes!</p>
                        <p className="text-gray-400 text-sm mt-2">Todas las ventas han sido pagadas</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAdeudos.map((adeudo) => {
                      const daysOverdue = getDaysOverdue(adeudo.fecha_venta || adeudo.created_at);
                      const overdueColor = getOverdueColor(daysOverdue);

                      return (
                        <tr key={adeudo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{adeudo.cliente?.nombre || 'Sin nombre'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">{adeudo.cliente?.telefono || 'Sin teléfono'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">{formatDate(adeudo.fecha_venta || adeudo.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${overdueColor}`}>
                              {daysOverdue} {daysOverdue === 1 ? 'día' : 'días'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-red-600">{formatCurrency(adeudo.saldoPendiente)}</span>
                                <span className="text-xs text-gray-500">Saldo pendiente</span>
                              </div>
                              {adeudo.totalAbonos > 0 && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${adeudo.porcentajePagado}%` }}
                                  ></div>
                                </div>
                              )}
                              {adeudo.totalAbonos > 0 && (
                                <div className="text-xs text-gray-500">
                                  {adeudo.porcentajePagado}% pagado ({formatCurrency(adeudo.totalAbonos)})
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => handleVerNota(adeudo)}
                                className="inline-flex items-center px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Ver
                              </button>
                              <button
                                onClick={() => handleRegistrarAbono(adeudo)}
                                className="inline-flex items-center px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Abono
                              </button>
                              {adeudo.totalAbonos > 0 && (
                                <button
                                  onClick={() => handleVerHistorial(adeudo)}
                                  className="inline-flex items-center px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                  <History className="h-3 w-3 mr-1" />
                                  Historial
                                </button>
                              )}
                              <button
                                onClick={() => handleMarcarComoPagado(adeudo)}
                                className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Pagado
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Modal de Confirmación Personalizado */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      Confirmar Pago
                    </h3>
                    <p className="text-green-100 text-sm">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="px-6 py-6">
                <div className="mb-4">
                  <p className="text-gray-700 text-base mb-2">
                    ¿Estás seguro de que quieres marcar esta venta como pagada?
                  </p>
                  
                  {selectedAdeudo && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Cliente:</span>
                          <p className="text-gray-900">{selectedAdeudo.cliente?.nombre || 'Sin nombre'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Monto:</span>
                          <p className="text-green-600 font-semibold">{formatCurrency(selectedAdeudo.total)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Teléfono:</span>
                          <p className="text-gray-900">{selectedAdeudo.cliente?.telefono || 'Sin teléfono'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Fecha:</span>
                          <p className="text-gray-900">{formatDate(selectedAdeudo.fecha_venta || selectedAdeudo.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones del Modal */}
                <div className="flex space-x-3">
                  <button
                    onClick={cancelMarcarComoPagado}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmMarcarComoPagado}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Pago
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Ver Nota */}
        {showViewNoteModal && selectedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">
                        Detalles de la Venta
                      </h3>
                      <p className="text-blue-100 text-sm">
                        Información completa de la nota de venta
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeViewNoteModal}
                    className="text-white hover:text-blue-200 transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="px-6 py-6">
                {/* Información General */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Información General</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="font-medium text-gray-600 block">Estado:</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Pendiente
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="font-medium text-gray-600 block">Fecha de Venta:</span>
                      <p className="text-gray-900">{formatDate(selectedNote.fecha_venta || selectedNote.created_at)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="font-medium text-gray-600 block">Subtotal:</span>
                      <p className="text-gray-900 font-semibold">{formatCurrency(selectedNote.subtotal || 0)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="font-medium text-gray-600 block">Total:</span>
                      <p className="text-green-600 font-bold text-lg">{formatCurrency(selectedNote.total)}</p>
                    </div>
                  </div>
                </div>

                {/* Información del Cliente */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h4>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-600 block">Nombre:</span>
                        <p className="text-gray-900 font-semibold">{selectedNote.cliente?.nombre || 'Sin nombre'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block">Teléfono:</span>
                        <p className="text-gray-900">{selectedNote.cliente?.telefono || 'Sin teléfono'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block">Email:</span>
                        <p className="text-gray-900">{selectedNote.cliente?.correo || 'Sin email'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles de Precios y Descuentos */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalles de Precios</h4>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Precios Base */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-800">Precios Base</h5>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Precio del Armazón:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(selectedNote.precio_armazon || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Precio de las Micas:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(selectedNote.precio_micas || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Descuentos */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-800">Descuentos Aplicados</h5>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Descuento Armazón:</span>
                            <span className="font-semibold text-red-600">
                              -{formatCurrency(selectedNote.descuento_armazon_monto || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Descuento Micas:</span>
                            <span className="font-semibold text-red-600">
                              -{formatCurrency(selectedNote.descuento_micas_monto || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-gray-600">Descuento General:</span>
                            <span className="font-semibold text-red-600">
                              -{formatCurrency(selectedNote.descuento_monto || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información Adicional */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-600 block">Tipo de Micas:</span>
                        <p className="text-gray-900">{selectedNote.descripcion_micas || 'Sin especificar'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block">Requiere Factura:</span>
                        <p className="text-gray-900">
                          {selectedNote.requiere_factura ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ✓ Requiere factura
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              ✗ No requiere factura
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Datos de Facturación */}
                {selectedNote.requiere_factura && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Datos de Facturación</h4>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-600 block">RFC:</span>
                          <p className="text-gray-900 font-semibold">{selectedNote.rfc || 'Sin RFC'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 block">Razón Social:</span>
                          <p className="text-gray-900 font-semibold">{selectedNote.razon_social || 'Sin razón social'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 block">Monto IVA:</span>
                          <p className="text-blue-600 font-bold">{formatCurrency(selectedNote.monto_iva || 0)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 block">Total con IVA:</span>
                          <p className="text-green-600 font-bold text-lg">{formatCurrency(selectedNote.total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Productos Vendidos */}
                {selectedNote.productos && selectedNote.productos.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Productos Vendidos</h4>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Producto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cantidad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio Unit.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedNote.productos.map((producto, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {producto.nombre || 'Producto sin nombre'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {producto.cantidad || 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatCurrency(producto.precio || 0)}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {formatCurrency((producto.precio || 0) * (producto.cantidad || 1))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notas Adicionales */}
                {selectedNote.notas && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Notas Adicionales</h4>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-gray-700">{selectedNote.notas}</p>
                    </div>
                  </div>
                )}

                {/* Botones del Modal */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeViewNoteModal}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Pasar todos los datos de la venta para preservar los montos
                        const ventaData = {
                          estado: 'completada',
                          // Preservar todos los datos importantes de la venta
                          precio_armazon: selectedNote.precio_armazon || 0,
                          precio_micas: selectedNote.precio_micas || 0,
                          subtotal: selectedNote.subtotal || 0,
                          total: selectedNote.total || 0,
                          descuento_armazon_monto: selectedNote.descuento_armazon_monto || 0,
                          descuento_micas_monto: selectedNote.descuento_micas_monto || 0,
                          descuento_monto: selectedNote.descuento_monto || 0,
                          monto_iva: selectedNote.monto_iva || 0,
                          requiere_factura: selectedNote.requiere_factura || false,
                          rfc: selectedNote.rfc || null,
                          razon_social: selectedNote.razon_social || null,
                          observaciones: selectedNote.observaciones || null
                        };

                        const { error } = await salesService.updateSalesNote(selectedNote.id, ventaData);

                        if (error) {
                          toast.error('Error al actualizar el estado');
                          return;
                        }

                        toast.success('Venta marcada como pagada');
                        closeViewNoteModal();
                        loadAdeudos();
                      } catch (error) {
                        toast.error('Error al actualizar el estado');
                        console.error('Error:', error);
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Pagado
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Registrar Abono */}
        {showAbonoModal && selectedVentaForAbono && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      Registrar Abono
                    </h3>
                    <p className="text-purple-100 text-sm">
                      Cliente: {selectedVentaForAbono.cliente?.nombre}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="px-6 py-6">
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Total de la Venta:</span>
                        <p className="text-gray-900 font-semibold">{formatCurrency(selectedVentaForAbono.total)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Saldo Pendiente:</span>
                        <p className="text-red-600 font-bold">{formatCurrency(selectedVentaForAbono.saldoPendiente)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto del Abono *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedVentaForAbono.saldoPendiente}
                        value={abonoData.monto}
                        onChange={(e) => setAbonoData({ ...abonoData, monto: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Forma de Pago *
                      </label>
                      <select
                        value={abonoData.forma_pago}
                        onChange={(e) => setAbonoData({ ...abonoData, forma_pago: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta_debito">Tarjeta de Débito</option>
                        <option value="tarjeta_credito">Tarjeta de Crédito</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones (opcional)
                      </label>
                      <textarea
                        value={abonoData.observaciones}
                        onChange={(e) => setAbonoData({ ...abonoData, observaciones: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows="3"
                        placeholder="Ej: Referencia de transferencia, número de tarjeta, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Botones del Modal */}
                <div className="flex space-x-3">
                  <button
                    onClick={closeAbonoModal}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCrearAbono}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Abono
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Ver Historial de Abonos */}
        {showHistorialModal && selectedVentaForAbono && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <History className="h-8 w-8 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">
                        Historial de Abonos
                      </h3>
                      <p className="text-gray-100 text-sm">
                        Cliente: {selectedVentaForAbono.cliente?.nombre}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeHistorialModal}
                    className="text-white hover:text-gray-200 transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="px-6 py-6">
                {/* Resumen */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-sm text-gray-600">Total de la Venta</span>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedVentaForAbono.total)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Abonado</span>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(selectedVentaForAbono.totalAbonos)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Saldo Pendiente</span>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(selectedVentaForAbono.saldoPendiente)}</p>
                    </div>
                  </div>
                </div>

                {/* Lista de Abonos */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Abonos Registrados</h4>
                  {historialAbonos.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No hay abonos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historialAbonos.map((abono, index) => (
                        <div key={abono.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          {editingAbonoId === abono.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Abono #{index + 1}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(abono.fecha_abono)}
                                </span>
                              </div>
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Monto
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={editAbonoData.monto}
                                  onChange={(e) => setEditAbonoData({ ...editAbonoData, monto: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Forma de Pago
                                </label>
                                <select
                                  value={editAbonoData.forma_pago}
                                  onChange={(e) => setEditAbonoData({ ...editAbonoData, forma_pago: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="efectivo">Efectivo</option>
                                  <option value="tarjeta_debito">Tarjeta de Débito</option>
                                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                                  <option value="transferencia">Transferencia</option>
                                </select>
                              </div>
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Observaciones
                                </label>
                                <textarea
                                  value={editAbonoData.observaciones}
                                  onChange={(e) => setEditAbonoData({ ...editAbonoData, observaciones: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  rows="2"
                                  placeholder="Observaciones"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleSaveEditAbono}
                                  className="inline-flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Guardar
                                </button>
                                <button
                                  onClick={handleCancelEditAbono}
                                  className="inline-flex items-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Abono #{index + 1}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {formatDate(abono.fecha_abono)}
                                  </span>
                                </div>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(abono.monto)}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Forma de pago: <span className="font-medium">{formatPaymentMethod(abono.forma_pago)}</span>
                                </p>
                                {abono.observaciones && (
                                  <p className="text-sm text-gray-600 mt-1">{abono.observaciones}</p>
                                )}
                              </div>
                              <div>
                                <button
                                  onClick={() => handleEditAbono(abono)}
                                  className="inline-flex items-center px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Editar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botón Cerrar */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeHistorialModal}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdeudosManagement;

