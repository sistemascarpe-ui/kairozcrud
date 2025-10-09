import React, { useState } from 'react';
import { Calendar, ChevronDown, Filter } from 'lucide-react';

const DateFilters = ({ onFilterChange, currentFilter }) => {
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const predefinedFilters = [
    { value: 'week', label: 'Última Semana', days: 7 },
    { value: 'month', label: 'Último Mes', days: 30 },
    { value: 'quarter', label: 'Último Trimestre', days: 90 },
    { value: 'year', label: 'Último Año', days: 365 },
    { value: 'custom', label: 'Rango Personalizado', days: null }
  ];

  const handleFilterChange = (filterValue) => {
    if (filterValue === 'custom') {
      setShowCustomRange(true);
      return;
    }
    
    setShowCustomRange(false);
    const filter = predefinedFilters.find(f => f.value === filterValue);
    
    if (filter) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filter.days);
      
      onFilterChange({
        type: filterValue,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        label: filter.label
      });
    }
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      if (new Date(customStartDate) > new Date(customEndDate)) {
        alert('La fecha de inicio debe ser anterior a la fecha de fin');
        return;
      }
      
      // Formatear fechas en formato dd/mm/yyyy
      const formatDate = (dateString) => {
        // Crear fecha local para evitar problemas de zona horaria
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      };
      
      onFilterChange({
        type: 'custom',
        startDate: customStartDate,
        endDate: customEndDate,
        label: `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
      });
      setShowCustomRange(false);
    } else {
      alert('Por favor selecciona ambas fechas');
    }
  };

  const getCurrentFilterLabel = () => {
    if (currentFilter?.type === 'custom') {
      return currentFilter.label;
    }
    const filter = predefinedFilters.find(f => f.value === currentFilter?.type);
    return filter?.label || 'Último Mes';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros de Fecha</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filtros predefinidos */}
          <div className="flex flex-wrap gap-2">
            {predefinedFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterChange(filter.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentFilter?.type === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Indicador del filtro actual */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {getCurrentFilterLabel()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Panel de rango personalizado */}
      {showCustomRange && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Seleccionar Rango Personalizado</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowCustomRange(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleCustomRangeApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilters;