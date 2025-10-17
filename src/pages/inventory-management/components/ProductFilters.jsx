import React from 'react';
import Select from '../../../components/ui/Select';
import SearchBar from '../../../components/ui/SearchBar';
import Button from '../../../components/ui/Button';

const ProductFilters = ({
  searchTerm,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  selectedGroup,
  onGroupChange,
  selectedDescription,
  onDescriptionChange,
  selectedSubBrand,
  onSubBrandChange,
  selectedStockStatus,
  onStockStatusChange,
  resultCount,
  totalUnits = 0,
  brands = [],
  groups = [],
  descriptions = [],
  subBrands = []
}) => {
  // Generar opciones dinámicamente desde los datos de la base de datos
  const brandOptions = [
    { value: '', label: 'Todas las marcas' },
    ...brands.map(brand => ({ value: brand.id, label: brand.nombre }))
  ];

  const groupOptions = [
    { value: '', label: 'Todos los grupos' },
    ...groups.map(group => ({ value: group.id, label: group.nombre }))
  ];

  const descriptionOptions = [
    { value: '', label: 'Todas las descripciones' },
    ...descriptions.map(desc => ({ value: desc.id, label: desc.nombre }))
  ];

  const subBrandOptions = [
    { value: '', label: 'Todas las sub marcas' },
    ...subBrands.map(subBrand => ({ value: subBrand.id, label: subBrand.nombre }))
  ];

  const stockStatusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'in-stock', label: 'En Stock' },
    { value: 'out-of-stock', label: 'Agotado' }
  ];

  const hasActiveFilters = selectedBrand || selectedGroup || selectedDescription || selectedSubBrand || selectedStockStatus || searchTerm;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
        <div className="flex-1">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por modelo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-300 rounded-2xl text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-md">
              {resultCount}
            </div>
            <div className="text-sm text-gray-700 mt-1 font-medium">tipos de armazones</div>
          </div>
          <div className="text-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-md">
              {totalUnits}
            </div>
            <div className="text-sm text-gray-700 mt-1 font-medium">armazones</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white bg-blue-500 px-3 py-1 rounded-full">Marca</label>
          <div className="bg-blue-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-blue-200 transition-all duration-200">
            <Select
              options={brandOptions}
              value={selectedBrand}
              onChange={onBrandChange}
              searchable
              placeholder=""
              className="w-full [&>div>button]:bg-blue-50 [&>div>button]:border-0 [&>div>button]:text-blue-800 [&>div>button]:hover:bg-blue-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-blue-50 [&>div>div>div>div]:text-blue-800 [&>div>div>div>div]:hover:bg-blue-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white bg-green-500 px-3 py-1 rounded-full">Grupo</label>
          <div className="bg-green-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-green-200 transition-all duration-200">
            <Select
              options={groupOptions}
              value={selectedGroup}
              onChange={onGroupChange}
              searchable
              placeholder=""
              className="w-full [&>div>button]:bg-green-50 [&>div>button]:border-0 [&>div>button]:text-green-800 [&>div>button]:hover:bg-green-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-green-50 [&>div>div>div>div]:text-green-800 [&>div>div>div>div]:hover:bg-green-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white bg-purple-500 px-3 py-1 rounded-full">Descripción</label>
          <div className="bg-purple-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-purple-200 transition-all duration-200">
            <Select
              options={descriptionOptions}
              value={selectedDescription}
              onChange={onDescriptionChange}
              searchable
              placeholder=""
              className="w-full [&>div>button]:bg-purple-50 [&>div>button]:border-0 [&>div>button]:text-purple-800 [&>div>button]:hover:bg-purple-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-purple-50 [&>div>div>div>div]:text-purple-800 [&>div>div>div>div]:hover:bg-purple-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white bg-pink-500 px-3 py-1 rounded-full">Sub Marca</label>
          <div className="bg-pink-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-pink-200 transition-all duration-200">
            <Select
              options={subBrandOptions}
              value={selectedSubBrand}
              onChange={onSubBrandChange}
              searchable
              placeholder=""
              className="w-full [&>div>button]:bg-pink-50 [&>div>button]:border-0 [&>div>button]:text-pink-800 [&>div>button]:hover:bg-pink-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-pink-50 [&>div>div>div>div]:text-pink-800 [&>div>div>div>div]:hover:bg-pink-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white bg-yellow-500 px-3 py-1 rounded-full">Estado de Stock</label>
          <div className="bg-yellow-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-yellow-200 transition-all duration-200">
            <Select
              options={stockStatusOptions}
              value={selectedStockStatus}
              onChange={onStockStatusChange}
              placeholder=""
              className="w-full [&>div>button]:bg-yellow-50 [&>div>button]:border-0 [&>div>button]:text-yellow-800 [&>div>button]:hover:bg-yellow-100 [&>div>button]:focus:ring-0 [&>div>button]:focus:outline-none [&>div>button]:shadow-none [&>div>div]:bg-white [&>div>div]:border-0 [&>div>div>div>div]:bg-yellow-50 [&>div>div>div>div]:text-yellow-800 [&>div>div>div>div]:hover:bg-yellow-100"
            />
          </div>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="bg-red-100 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:bg-red-200 transition-all duration-200 inline-block">
            <Button
              variant="outline"
              iconName="RotateCcw"
              onClick={() => {
                onSearchChange('');
                onBrandChange('');
                onGroupChange('');
                onDescriptionChange('');
                onSubBrandChange('');
                onStockStatusChange('');
              }}
              className="text-red-700 hover:text-red-900 font-semibold border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:outline-none shadow-none"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      )}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t-2 border-blue-300">
          <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg font-bold text-gray-800 bg-white px-3 py-1 rounded-full shadow-md">🎯 Filtros Activos:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {searchTerm && (
                <span className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-full shadow-md">
                  🔍 "{searchTerm}"
                </span>
              )}
              
              {selectedBrand && (
                <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-md">
                  🏷️ {brandOptions?.find(c => c?.value === selectedBrand)?.label}
                </span>
              )}
              
              {selectedGroup && (
                <span className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-full shadow-md">
                  📦 {groupOptions?.find(s => s?.value === selectedGroup)?.label}
                </span>
              )}

              {selectedDescription && (
                <span className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-full shadow-md">
                  📝 {descriptionOptions?.find(d => d?.value === selectedDescription)?.label}
                </span>
              )}

              {selectedSubBrand && (
                <span className="inline-flex items-center px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-full shadow-md">
                  🏢 {subBrandOptions?.find(sb => sb?.value === selectedSubBrand)?.label}
                </span>
              )}
              
              {selectedStockStatus && (
                <span className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-full shadow-md">
                  📊 {stockStatusOptions?.find(s => s?.value === selectedStockStatus)?.label}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;