import React, { useState, useMemo, useEffect, forwardRef } from 'react';
import { Helmet } from 'react-helmet';
import { Calendar, Search, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { customerService } from '../../services/customerService';
import { userService } from '../../services/userService';
import { empresaService } from '../../services/empresaService';
import Header from '../../components/ui/Header';
import CustomerTable from './components/CustomerTable';
import CustomerModal from './components/CustomerModal';
import HistorialGraduacionesModal from './components/HistorialGraduacionesModal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

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

const CustomerManagement = () => {
  const { user, userProfile } = useAuth();
  
  // State management
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [selectedCustomerForHistorial, setSelectedCustomerForHistorial] = useState(null);
  const [error, setError] = useState('');

  // Load customers and users
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load customers
        const customerResult = await customerService?.getCustomers();
        if (customerResult?.error) {
          setError(`Error loading customers: ${customerResult?.error}`);
        } else {
          setCustomers(customerResult?.data || []);
        }

        // Load users
        const userResult = await userService?.getUsers();
        if (userResult?.error) {
          console.error('Error loading users:', userResult?.error);
        } else {
          setUsers(userResult?.data || []);
        }

        // Load empresas
        const empresaResult = await empresaService?.getEmpresas();
        if (empresaResult?.error) {
          console.error('Error loading empresas:', empresaResult?.error);
        } else {
          setEmpresas(empresaResult?.data || []);
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Transform customers for display
  const transformedCustomers = useMemo(() => {
    return customers?.map(customer => ({
      id: customer?.id,
      nombre: customer?.nombre || '',
      telefono: customer?.telefono || '',
      correo: customer?.correo || '',
      empresa_id: customer?.empresa_id || '',
      empresa: customer?.empresas?.nombre || '',
      created_at: customer?.created_at,
      creado_por_id: customer?.creado_por_id, // Mantener el ID original
      usuarios: customer?.usuarios, // Mantener la información del usuario
      atendido_por: customer?.usuarios ? 
        `${customer?.usuarios?.nombre} ${customer?.usuarios?.apellido || ''}`?.trim() : 
        'Usuario desconocido'
    })) || [];
  }, [customers]);

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = transformedCustomers?.filter(customer => {
      const matchesName = !searchName || 
        customer?.nombre?.toLowerCase()?.includes(searchName?.toLowerCase()) ||
        customer?.nombre?.toLowerCase()?.split(' ')?.some(word => 
          word?.startsWith(searchName?.toLowerCase())
        );
      
      const matchesPhone = !searchPhone || 
        customer?.telefono?.toLowerCase()?.includes(searchPhone?.toLowerCase());
      
      const matchesDate = !selectedDate || 
        (customer?.created_at && new Date(customer?.created_at).toDateString() === selectedDate.toDateString());
      
      const matchesUser = selectedUsers?.length === 0 || 
        selectedUsers?.some(userId => {
          const user = users?.find(u => u?.id === userId);
          const userName = user ? `${user?.nombre} ${user?.apellido || ''}`.trim() : '';
          return customer?.atendido_por?.toLowerCase()?.includes(userName?.toLowerCase());
        });

      const matchesEmpresa = !selectedEmpresa || 
        customer?.empresa_id === selectedEmpresa;

      return matchesName && matchesPhone && matchesDate && matchesUser && matchesEmpresa;
    });

    // Sort customers
    filtered?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig?.direction === 'asc' 
          ? aValue?.localeCompare(bValue)
          : bValue?.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig?.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }

      if (sortConfig?.key === 'created_at') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig?.direction === 'asc' 
          ? aDate - bDate
          : bDate - aDate;
      }

      return 0;
    });

    return filtered || [];
  }, [transformedCustomers, searchName, searchPhone, selectedDate, selectedUsers, selectedEmpresa, sortConfig, users]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setSelectedDate(null);
    setSelectedUsers([]);
    setSelectedEmpresa('');
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEditCustomer = (customer) => {
    setModalMode('edit');
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('add');
    setIsCustomerModalOpen(true);
  };

  const handleViewHistorial = (customer) => {
    setSelectedCustomerForHistorial(customer);
    setIsHistorialModalOpen(true);
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      setError('');
      
      if (modalMode === 'add') {
        // Create new customer
        const { data, error } = await customerService.createCustomer({
          nombre: customerData.nombre,
          telefono: customerData.telefono,
          correo: customerData.correo,
          empresa_id: customerData.empresa_id || null,
          creado_por_id: customerData.creado_por_id
        });

        if (error) {
          toast.error(`Error al crear cliente: ${error}`);
          throw new Error(error);
        }

        // Reload customers to show the new one
        const loadResult = await customerService?.getCustomers();
        if (loadResult?.data) {
          setCustomers(loadResult.data);
        }
        
        toast.success('Cliente creado exitosamente');
        
      } else if (modalMode === 'edit') {
        // Update existing customer
        const { data, error } = await customerService.updateCustomer(selectedCustomer?.id, {
          nombre: customerData.nombre,
          telefono: customerData.telefono,
          correo: customerData.correo,
          empresa_id: customerData.empresa_id || null,
          creado_por_id: customerData.creado_por_id
        });

        if (error) {
          toast.error(`Error al actualizar cliente: ${error}`);
          throw new Error(error);
        }

        // Reload customers to show the updated data
        const loadResult = await customerService?.getCustomers();
        if (loadResult?.data) {
          setCustomers(loadResult.data);
        }
        
        toast.success('Cliente actualizado exitosamente');
      }
      
      setIsCustomerModalOpen(false);
      setSelectedCustomer(null);
      
    } catch (error) {
      console.error('Error saving customer:', error);
      if (!error.message.includes('Error al')) {
        toast.error(error?.message || 'Error al guardar el cliente');
      }
      setError(error?.message || 'Error al guardar el cliente');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestión de Clientes - Ópticas Kairoz</title>
        <meta name="description" content="Administra clientes y citas con sistema completo de gestión" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
          
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Mostrando {filteredAndSortedCustomers?.length} de {transformedCustomers?.length} clientes
            </p>
          </div>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Historial Clínico de Clientes
              </h1>
              <p className="text-muted-foreground mt-2">
                Administra el historial clínico completo y datos de prescripciones de tus clientes
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={handleAddCustomer}
                iconName="Plus"
                className="w-full sm:w-auto"
              >
                Agregar Cliente
              </Button>
            </div>
          </div>

          {/* Search Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
              <Button variant="ghost" onClick={clearAllFilters} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                <X className="h-4 w-4" />
                <span>Limpiar Filtros</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nombre</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Nombre y apellido..." 
                    value={searchName} 
                    onChange={(e) => setSearchName(e.target.value)} 
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por teléfono</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Número de teléfono..." 
                    value={searchPhone} 
                    onChange={(e) => setSearchPhone(e.target.value)} 
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por fecha</label>
                <DatePicker 
                  selected={selectedDate} 
                  onChange={(date) => setSelectedDate(date)} 
                  customInput={<CustomDateInput placeholder="dd/mm/aaaa" />}
                  isClearable
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por usuario</label>
                <Select 
                  value={selectedUsers.length > 0 ? selectedUsers[0] : ''} 
                  onChange={(value) => setSelectedUsers(value ? [value] : [])} 
                  options={[
                    { value: '', label: 'Todos los usuarios' },
                    ...users.map(user => ({ 
                      value: user.id, 
                      label: `${user.nombre} ${user.apellido || ''}`.trim() 
                    }))
                  ]} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por empresa</label>
                <Select 
                  value={selectedEmpresa} 
                  onChange={(value) => setSelectedEmpresa(value)} 
                  options={[
                    { value: '', label: 'Todas las empresas' },
                    ...empresas.map(empresa => ({ 
                      value: empresa.id, 
                      label: empresa.nombre 
                    }))
                  ]} 
                />
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <CustomerTable
            customers={filteredAndSortedCustomers}
            onEditCustomer={handleEditCustomer}
            onViewHistorial={handleViewHistorial}
            handleSort={handleSort}
            sortConfig={sortConfig}
          />

          {/* Customer Modal */}
          <CustomerModal
            isOpen={isCustomerModalOpen}
            onClose={() => setIsCustomerModalOpen(false)}
            customer={selectedCustomer}
            onSave={handleSaveCustomer}
            mode={modalMode}
            users={users}
            empresas={empresas}
          />

          {/* Historial Graduaciones Modal */}
          <HistorialGraduacionesModal
            isOpen={isHistorialModalOpen}
            onClose={() => setIsHistorialModalOpen(false)}
            customer={selectedCustomerForHistorial}
            users={users}
          />
        </main>
      </div>
    </>
  );
};

export default CustomerManagement;