import React, { useRef, useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CustomerTable = ({ 
  customers, 
  onEditCustomer,
  onViewHistorial,
  handleSort,
  sortConfig
}) => {
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Calcular el ancho de la tabla y actualizar el scroll superior
  useEffect(() => {
    if (tableScrollRef.current) {
      const scrollWidth = tableScrollRef.current.scrollWidth;
      setTableWidth(scrollWidth);
    }
  }, [customers]);

  // Sincronizar scroll superior con scroll de la tabla
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const tableScroll = tableScrollRef.current;

    if (!topScroll || !tableScroll) return;

    const handleTopScroll = (e) => {
      if (tableScroll.scrollLeft !== topScroll.scrollLeft) {
        tableScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    const handleTableScroll = (e) => {
      if (topScroll.scrollLeft !== tableScroll.scrollLeft) {
        topScroll.scrollLeft = tableScroll.scrollLeft;
      }
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    tableScroll.addEventListener('scroll', handleTableScroll);

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      tableScroll.removeEventListener('scroll', handleTableScroll);
    };
  }, [tableWidth]);
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString)?.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const SortIcon = ({ field }) => {
    if (sortConfig?.key !== field) {
      return <Icon name="ArrowUpDown" size={14} className="text-muted-foreground" />;
    }
    return (
      <Icon 
        name={sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown'} 
        size={14} 
        className="text-primary" 
      />
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        {/* Scroll horizontal superior */}
        <div 
          ref={topScrollRef}
          className="overflow-x-auto overflow-y-hidden border-b border-border bg-muted/30"
          style={{ height: '20px' }}
        >
          <div style={{ width: `${tableWidth}px`, height: '1px' }}></div>
        </div>
        
        {/* Tabla principal */}
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-smooth"
                onClick={() => handleSort('nombre')}
              >
                <div className="flex items-center space-x-1">
                  <span>Nombre</span>
                  <SortIcon field="nombre" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Correo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Empresa
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-smooth"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fecha Registro</span>
                  <SortIcon field="created_at" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-smooth"
                onClick={() => handleSort('atendido_por')}
              >
                <div className="flex items-center space-x-1">
                  <span>Atendido por</span>
                  <SortIcon field="atendido_por" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {customers?.map((customer) => (
              <tr key={customer?.id} className="hover:bg-muted/30 transition-smooth">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Edit"
                      onClick={() => onEditCustomer(customer)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="History"
                      onClick={() => onViewHistorial(customer)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Historial
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {customer?.nombre?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-foreground">
                        {customer?.nombre || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {customer?.id?.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                  {customer?.telefono || 'N/A'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                  {customer?.correo || 'N/A'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                  {customer?.empresa || 'N/A'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                  {formatDate(customer?.created_at)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                  {customer?.atendido_por || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {customers?.map((customer) => (
          <div key={customer?.id} className="p-4 border-b border-border last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {customer?.nombre?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-foreground">{customer?.nombre || 'N/A'}</h3>
                  <p className="text-xs text-muted-foreground">ID: {customer?.id?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="flex items-center">
                <Icon name="Phone" size={14} className="text-muted-foreground mr-2" />
                <span className="text-foreground">{customer?.telefono || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Icon name="Mail" size={14} className="text-muted-foreground mr-2" />
                <span className="text-foreground">{customer?.correo || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Icon name="Building" size={14} className="text-muted-foreground mr-2" />
                <span className="text-foreground">{customer?.empresa || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Icon name="Calendar" size={14} className="text-muted-foreground mr-2" />
                <span className="text-foreground">{formatDate(customer?.created_at)}</span>
              </div>
              <div className="flex items-center col-span-2">
                <Icon name="User" size={14} className="text-muted-foreground mr-2" />
                <span className="text-foreground">Atendido por: {customer?.atendido_por || 'N/A'}</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                iconName="Edit"
                onClick={() => onEditCustomer(customer)}
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconName="History"
                onClick={() => onViewHistorial(customer)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Historial
              </Button>
            </div>
          </div>
        ))}
      </div>

      {customers?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay clientes registrados</h3>
          <p className="text-muted-foreground">Los clientes aparecerán aquí una vez que sean registrados en el sistema.</p>
        </div>
      )}
    </div>
  );
};

export default CustomerTable;
