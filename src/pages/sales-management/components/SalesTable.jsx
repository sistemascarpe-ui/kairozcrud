import React from 'react';
import { Edit } from 'lucide-react';
import Button from '../../../components/ui/Button';

const SalesTable = ({ sales = [], onEdit, loading = false }) => {
  const sortedSales = [...sales];

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Mexico_City' 
  };

  return new Date(dateString).toLocaleDateString('es-ES', options);
};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'completada': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completada' },
      'pagado': { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagado' },
      'pagada': { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagada' },
      'cancelada': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig['pendiente'];
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  if (loading) return <div>Cargando...</div>;
  if (sales.length === 0) return <div>No hay notas de venta registradas</div>;

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      {/* Tabla principal con scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Armazón</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Mica</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc. Armazón</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc. Micas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desc. General</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IVA (16%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSales.map((sale) => (
              <tr key={sale.id} className="group hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(sale)} className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{sale.cliente?.nombre || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{sale.cliente?.telefono}</div>
                </td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  <div className="font-medium">
    {}
    {`${sale.armazon?.marcas?.nombre || ''} - ${sale.armazon?.sku || ''} - ${sale.armazon?.color || ''}`}
  </div>
  <div className="text-gray-500">{formatCurrency(sale.armazon?.precio)}</div>
</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-medium">{sale.tipo_mica?.nombre || 'N/A'}</div>
                  <div className="text-gray-500">{formatCurrency(sale.tipo_mica?.precio)}</div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {sale.descuento_armazon_monto > 0 ? (
                    <div className="text-xs text-blue-600">
                      {formatCurrency(sale.descuento_armazon_monto)}
                    </div>
                  ) : (<div className="text-xs text-gray-400">Sin desc.</div>)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {sale.descuento_micas_monto > 0 ? (
                    <div className="text-xs text-green-600">
                      {formatCurrency(sale.descuento_micas_monto)}
                    </div>
                  ) : (<div className="text-xs text-gray-400">Sin desc.</div>)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {sale.descuento_monto > 0 ? (
                    <div className="text-xs text-purple-600">
                      {formatCurrency(sale.descuento_monto)}
                    </div>
                  ) : (<div className="text-xs text-gray-400">Sin desc.</div>)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{formatCurrency(sale.subtotal)}</td>
                
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {sale.requiere_factura ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Sí
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      No
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {sale.monto_iva > 0 ? (
                    <div className="text-xs text-blue-600">
                      {formatCurrency(sale.monto_iva)}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.rfc ? (
                    <div className="font-mono text-xs">{sale.rfc}</div>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.razon_social ? (
                    <div className="max-w-[200px] truncate" title={sale.razon_social}>
                      {sale.razon_social}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{formatCurrency(sale.total)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sale.estado)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.vendedores && sale.vendedores.length > 0
                    ? sale.vendedores.map(v => `${v.nombre} ${v.apellido || ''}`.trim()).join(', ')
                    : 'No asignado'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTable;