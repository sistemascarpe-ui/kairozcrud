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
    <div className="bg-card rounded-lg border border-border p-6 shadow-soft">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Buscar por modelo..."
            searchType="inventory"
            onSearch={onSearchChange}
            onClear={() => onSearchChange('')}
            showFilters={false}
            className="max-w-md"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg">
            {resultCount} productos encontrados
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Select
          label="Marca"
          options={brandOptions}
          value={selectedBrand}
          onChange={onBrandChange}
          searchable
          className="w-full"
        />

        <Select
          label="Grupo"
          options={groupOptions}
          value={selectedGroup}
          onChange={onGroupChange}
          searchable
          className="w-full"
        />

        <Select
          label="Descripción"
          options={descriptionOptions}
          value={selectedDescription}
          onChange={onDescriptionChange}
          searchable
          className="w-full"
        />

        <Select
          label="Sub Marca"
          options={subBrandOptions}
          value={selectedSubBrand}
          onChange={onSubBrandChange}
          searchable
          className="w-full"
        />

        <Select
          label="Estado de Stock"
          options={stockStatusOptions}
          value={selectedStockStatus}
          onChange={onStockStatusChange}
          className="w-full"
        />

        <div className="flex items-end">
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
            disabled={!hasActiveFilters}
            fullWidth
          >
            Limpiar Filtros
          </Button>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
              Búsqueda: "{searchTerm}"
            </span>
          )}
          
          {selectedBrand && (
            <span className="inline-flex items-center px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-md">
              {brandOptions?.find(c => c?.value === selectedBrand)?.label}
            </span>
          )}
          
          {selectedGroup && (
            <span className="inline-flex items-center px-2 py-1 bg-accent/10 text-accent text-xs rounded-md">
              {groupOptions?.find(s => s?.value === selectedGroup)?.label}
            </span>
          )}

          {selectedDescription && (
            <span className="inline-flex items-center px-2 py-1 bg-info/10 text-info text-xs rounded-md">
              {descriptionOptions?.find(d => d?.value === selectedDescription)?.label}
            </span>
          )}

          {selectedSubBrand && (
            <span className="inline-flex items-center px-2 py-1 bg-success/10 text-success text-xs rounded-md">
              {subBrandOptions?.find(sb => sb?.value === selectedSubBrand)?.label}
            </span>
          )}
          
          {selectedStockStatus && (
            <span className="inline-flex items-center px-2 py-1 bg-warning/10 text-warning text-xs rounded-md">
              {stockStatusOptions?.find(s => s?.value === selectedStockStatus)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductFilters;