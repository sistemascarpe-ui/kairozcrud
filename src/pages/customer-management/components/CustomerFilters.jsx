import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CustomerFilters = ({ onFilterChange, activeFilters = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: activeFilters?.status || 'all',
    visitRange: activeFilters?.visitRange || 'all',
    hasInsurance: activeFilters?.hasInsurance || 'all',
    ageRange: activeFilters?.ageRange || 'all'
  });

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: 'all',
      visitRange: 'all',
      hasInsurance: 'all',
      ageRange: 'all'
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters)?.filter(value => value !== 'all')?.length;
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'pending', label: 'Pendientes' }
  ];

  const visitRangeOptions = [
    { value: 'all', label: 'Todas las fechas' },
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mes' },
    { value: 'quarter', label: 'Último trimestre' },
    { value: 'year', label: 'Último año' }
  ];

  const insuranceOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'yes', label: 'Con seguro' },
    { value: 'no', label: 'Sin seguro' }
  ];

  const ageRangeOptions = [
    { value: 'all', label: 'Todas las edades' },
    { value: '18-30', label: '18-30 años' },
    { value: '31-50', label: '31-50 años' },
    { value: '51-70', label: '51-70 años' },
    { value: '70+', label: '70+ años' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground">Filtros</h3>
          {getActiveFilterCount() > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              iconName="X"
            >
              Limpiar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado
            </label>
            <select
              value={localFilters?.status}
              onChange={(e) => handleFilterChange('status', e?.target?.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              {statusOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>

          {/* Visit Range Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Última Visita
            </label>
            <select
              value={localFilters?.visitRange}
              onChange={(e) => handleFilterChange('visitRange', e?.target?.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              {visitRangeOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>

          {/* Insurance Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Seguro Médico
            </label>
            <select
              value={localFilters?.hasInsurance}
              onChange={(e) => handleFilterChange('hasInsurance', e?.target?.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              {insuranceOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>

          {/* Age Range Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rango de Edad
            </label>
            <select
              value={localFilters?.ageRange}
              onChange={(e) => handleFilterChange('ageRange', e?.target?.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              {ageRangeOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button
          variant={localFilters?.status === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('status', localFilters?.status === 'active' ? 'all' : 'active')}
        >
          Solo Activos
        </Button>
        <Button
          variant={localFilters?.visitRange === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('visitRange', localFilters?.visitRange === 'month' ? 'all' : 'month')}
        >
          Visitaron Este Mes
        </Button>
        <Button
          variant={localFilters?.hasInsurance === 'yes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('hasInsurance', localFilters?.hasInsurance === 'yes' ? 'all' : 'yes')}
        >
          Con Seguro
        </Button>
      </div>
    </div>
  );
};

export default CustomerFilters;