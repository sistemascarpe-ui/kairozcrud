import React from 'react';
import { Users } from 'lucide-react';

const SalesByVendorList = ({ vendors }) => {
  if (!vendors || vendors.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No hay datos de vendedores</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-3">
        {vendors.slice(0, 5).map((vendor, index) => (
          <div key={vendor.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600">
                  {index + 1}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{vendor.name || vendor.nombre}</p>
                <p className="text-sm text-gray-500">
                  {vendor.totalSales || vendor.ventas} ventas
                  {vendor.completedSales !== undefined && vendor.pendingSales !== undefined && (
                    <span className="ml-1 text-xs">
                      ({vendor.completedSales} completadas, {vendor.pendingSales} pendientes)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                ${(vendor.totalRevenue || vendor.ingresos || 0).toLocaleString()}
              </p>
              {vendor.completedRevenue !== undefined && vendor.pendingRevenue !== undefined && (
                <p className="text-xs text-gray-400">
                  Completadas: ${vendor.completedRevenue.toLocaleString()} | 
                  Pendientes: ${vendor.pendingRevenue.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesByVendorList;