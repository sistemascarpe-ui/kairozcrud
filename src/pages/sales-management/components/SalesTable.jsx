import React, { useState, useCallback } from 'react';
import { Edit, MoreHorizontal, Ban } from 'lucide-react';
import Button from '../../../components/ui/Button';

const SalesTable = ({ sales = [], onEdit, onCancel, loading = false }) => {
  const sortedSales = React.useMemo(() => {
    const arr = [...(sales || [])];
    arr.sort((a, b) => {
      const aDigits = String(a?.folio || '').replace(/\D/g, '').slice(-4);
      const bDigits = String(b?.folio || '').replace(/\D/g, '').slice(-4);
      const aNum = aDigits ? parseInt(aDigits, 10) : -1;
      const bNum = bDigits ? parseInt(bDigits, 10) : -1;
      if (bNum !== aNum) return bNum - aNum;
      const ad = new Date(a?.created_at || 0).getTime();
      const bd = new Date(b?.created_at || 0).getTime();
      return bd - ad;
    });
    return arr;
  }, [sales]);
  const last4Counts = React.useMemo(() => {
    const counts = {};
    (sales || []).forEach(s => {
      const v = String(s?.folio || '').replace(/\D/g, '').slice(-4);
      if (v && v.length === 4) counts[v] = (counts[v] || 0) + 1;
    });
    return counts;
  }, [sales]);

  const [openMenuId, setOpenMenuId] = useState(null);
  const toggleMenu = useCallback((id) => {
    setOpenMenuId(prev => (prev === id ? null : id));
  }, []);

const formatDate = (dateString) => {
  if (!dateString) return '---';

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

  const getFolioDisplay = (folio) => {
    if (!folio) return '---';
    const digits = String(folio).replace(/\D/g, '');
    if (!digits) return '---';
    return digits.slice(-4);
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

  if (loading) {
    const skeletonRows = Array.from({ length: 12 });
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto relative" style={{ maxHeight: '70vh' }}>
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1740px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Acciones</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Folio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Clientes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Armazón</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Tipo de Mica</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Desc. Armazón</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Desc. Micas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Desc. General</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Subtotal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Factura</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">IVA (16%)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">RFC</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Razón Social</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Vendedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {skeletonRows.map((_, idx) => (
                <tr key={idx} className="group">
                  {Array.from({ length: 18 }).map((__, cIdx) => (
                    <td key={cIdx} className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: '100%' }}></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (sales.length === 0) return <div>No hay notas de venta registradas</div>;

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      {/* Contenedor con scroll horizontal y vertical */}
      <div className="overflow-x-auto overflow-y-auto relative" style={{ maxHeight: '70vh' }}>
        {/* Indicador de scroll horizontal */}
        <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
        <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
        <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1740px' }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Acciones</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Folio</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Clientes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Armazón</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Tipo de Mica</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Desc. Armazón</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Desc. Micas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Desc. General</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Subtotal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Factura</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">IVA (16%)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">RFC</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Razón Social</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Vendedor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Fecha</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSales.map((sale) => (
              <tr key={sale.id} className="group hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-left text-sm font-medium relative">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleMenu(sale.id)}
                      iconName={null}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {openMenuId === sale.id && (
                      <div className="absolute z-20 mt-2 bg-white border border-gray-200 rounded-md shadow-md p-2 left-4">
                        <div className="flex flex-col space-y-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const ok = window.confirm('¿Deseas editar esta nota?');
                                if (!ok) return;
                                onEdit(sale);
                                setOpenMenuId(null);
                              }}
                              className="justify-start"
                            >
                              <Edit className="h-4 w-4 mr-2" /> Editar
                            </Button>
                          )}
                          {onCancel && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => { onCancel(sale); setOpenMenuId(null); }}
                              className="justify-start"
                            >
                              <Ban className="h-4 w-4 mr-2" /> Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {(() => {
                    const last4 = getFolioDisplay(sale.folio);
                    const isDup = last4 && last4.length === 4 && last4Counts[last4] > 1;
                    const cls = isDup 
                      ? "text-sm font-mono font-bold text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5 inline-block"
                      : "text-sm font-mono font-bold text-gray-900";
                    return (
                      <div className={cls} title={sale.folio}>
                        {last4}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {sale.clientes && sale.clientes.length > 0 ? (
                    <div className="space-y-1">
                      {sale.clientes.map((cliente, index) => (
                        <div key={cliente.id || index}>
                          <div className="text-sm text-gray-900">{cliente.nombre}</div>
                          <div className="text-sm text-gray-500">{cliente.telefono}</div>
                        </div>
                      ))}
                    </div>
                  ) : sale.cliente ? (
                    <div>
                      <div className="text-sm text-gray-900">{sale.cliente.nombre}</div>
                      <div className="text-sm text-gray-500">{sale.cliente.telefono}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900">---</div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.clientes && sale.clientes.length > 0 ? (
                    <div className="space-y-1">
                      {sale.clientes.map((cliente, index) => (
                        <div key={cliente.id || index} className="text-xs text-gray-700">
                          {cliente.empresa ? cliente.empresa : 'Cliente Individual'}
                        </div>
                      ))}
                    </div>
                  ) : sale.cliente ? (
                    <div className="text-xs text-gray-700">
                      {sale.cliente.empresa ? sale.cliente.empresa : 'Cliente Individual'}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.productosArmazon && sale.productosArmazon.length > 0 ? (
                    <div className="space-y-1">
                      {sale.productosArmazon.map((producto, index) => (
                        <div key={index}>
          <div className="font-medium text-xs">
            {producto.armazon ? 
              `${producto.armazon.marca || ''} - ${producto.armazon.sku || ''} - ${producto.armazon.color || ''}` :
              'Armazón sin detalles'
            }
          </div>
          <div className="text-gray-500 text-xs">{formatCurrency(producto.precio_unitario)} x {producto.cantidad}</div>
        </div>
      ))}
    </div>
  ) : sale.armazon ? (
    <div>
      <div className="font-medium">
        {`${sale.armazon?.marcas?.nombre || ''} - ${sale.armazon?.sku || ''} - ${sale.armazon?.color || ''}`}
      </div>
      <div className="text-gray-500">{formatCurrency(sale.precio_armazon || sale.armazon?.precio)}</div>
    </div>
  ) : (
    <div className="text-gray-500">-</div>
  )}
</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.productosMica && sale.productosMica.length > 0 ? (
                    <div className="space-y-1">
                      {sale.productosMica.map((producto, index) => (
                        <div key={index}>
                          <div className="font-medium text-xs">
                            {`Mica - ${producto.descripcion_mica || 'Sin descripción'}`}
                          </div>
                          <div className="text-gray-500 text-xs">{formatCurrency(producto.precio_unitario)} x {producto.cantidad}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{sale.tipo_mica?.nombre || '---'}</div>
                      <div className="text-gray-500">{formatCurrency(sale.tipo_mica?.precio)}</div>
                    </div>
                  )}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {sale.descuento_armazon_monto > 0 ? (
                    <div className="text-xs text-blue-600">
                      {formatCurrency(sale.descuento_armazon_monto)}
                    </div>
                  ) : (<div className="text-xs text-gray-400">Sin desc.</div>)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {sale.descuento_micas_monto > 0 ? (
                    <div className="text-xs text-green-600">
                      {formatCurrency(sale.descuento_micas_monto)}
                    </div>
                  ) : (<div className="text-xs text-gray-400">Sin desc.</div>)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {sale.descuento_monto > 0 ? (
                    <div className="text-xs text-purple-600">
                      {formatCurrency(sale.descuento_monto)}
                    </div>
                  ) : (<div className="text-xs text-gray-400">Sin desc.</div>)}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{formatCurrency(sale.subtotal)}</td>
                
                <td className="px-4 py-4 whitespace-nowrap text-center">
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
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {sale.monto_iva > 0 ? (
                    <div className="text-xs text-blue-600">
                      {formatCurrency(sale.monto_iva)}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.rfc ? (
                    <div className="font-mono text-xs">{sale.rfc}</div>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.razon_social ? (
                    <div className="max-w-[200px] truncate" title={sale.razon_social}>
                      {sale.razon_social}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">-</div>
                  )}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                  {sale.requiere_factura ? 
                    formatCurrency(sale.total + (sale.monto_iva || 0)) : 
                    formatCurrency(sale.total)
                  }
                </td>
                <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(sale.estado)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.vendedores && sale.vendedores.length > 0
                    ? sale.vendedores.map(v => `${v.nombre} ${v.apellido || ''}`.trim()).join(', ')
                    : 'No asignado'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTable;