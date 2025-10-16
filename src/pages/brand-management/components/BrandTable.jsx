import React from 'react';
import Button from '../../../components/ui/Button';

const BrandTable = ({ brands, onEdit }) => {
  return (
    <div className="bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-muted/30 transition-smooth">
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{brand.nombre}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" iconName="Edit" onClick={() => onEdit(brand)}>
                      Editar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {brands.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">No se encontraron marcas.</p>
        </div>
      )}
    </div>
  );
};

export default BrandTable;