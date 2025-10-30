import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmpresaTable = ({ 
  empresas, 
  onEditEmpresa,
  onDeleteEmpresa,
  onSort,
  sortConfig
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('es-ES', {
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
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-smooth"
                onClick={() => onSort('nombre')}
              >
                <div className="flex items-center space-x-1">
                  <span>Nombre de la Empresa</span>
                  <SortIcon field="nombre" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-smooth"
                onClick={() => onSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fecha de Creación</span>
                  <SortIcon field="created_at" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {empresas?.map((empresa) => (
              <tr key={empresa?.id} className="hover:bg-muted/30 transition-smooth">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Edit"
                      onClick={() => onEditEmpresa(empresa)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      onClick={() => onDeleteEmpresa(empresa)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon name="Building" size={16} className="text-primary" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-foreground">
                        {empresa?.nombre || '---'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {empresa?.id?.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                  {formatDate(empresa?.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {empresas?.map((empresa) => (
          <div key={empresa?.id} className="p-4 border-b border-border last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Building" size={20} className="text-primary" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-foreground">{empresa?.nombre || '---'}</h3>
                  <p className="text-xs text-muted-foreground">Creado: {formatDate(empresa?.created_at)}</p>
                  <p className="text-xs text-muted-foreground">ID: {empresa?.id?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                iconName="Edit"
                onClick={() => onEditEmpresa(empresa)}
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconName="Trash2"
                onClick={() => onDeleteEmpresa(empresa)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {empresas?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Building" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay empresas registradas</h3>
          <p className="text-muted-foreground">Las empresas aparecerán aquí una vez que sean registradas en el sistema.</p>
        </div>
      )}
    </div>
  );
};

export default EmpresaTable;
