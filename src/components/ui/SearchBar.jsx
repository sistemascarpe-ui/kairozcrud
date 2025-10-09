import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import Input from './Input';

const SearchBar = ({ 
  placeholder = "Buscar...", 
  onSearch, 
  onClear,
  searchType = "general",
  className = "",
  showFilters = false,
  filters = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const searchRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef?.current && !filterRef?.current?.contains(event?.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value, activeFilters);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setActiveFilters([]);
    if (onClear) {
      onClear();
    }
    if (onSearch) {
      onSearch('', []);
    }
  };

  const handleFilterToggle = (filterId) => {
    const newFilters = activeFilters?.includes(filterId)
      ? activeFilters?.filter(id => id !== filterId)
      : [...activeFilters, filterId];
    
    setActiveFilters(newFilters);
    if (onSearch) {
      onSearch(searchTerm, newFilters);
    }
  };

  const getSearchIcon = () => {
    switch (searchType) {
      case 'inventory':
        return 'Package';
      case 'customer':
        return 'Users';
      default:
        return 'Search';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon 
              name={getSearchIcon()} 
              size={18} 
              className="text-muted-foreground" 
            />
          </div>
          
          <Input
            ref={searchRef}
            type="search"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e?.target?.value)}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => setIsExpanded(false)}
            className={`pl-10 pr-10 transition-all duration-200 ${
              isExpanded ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}
          />
          
          {searchTerm && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-foreground transition-smooth"
            >
              <Icon name="X" size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {showFilters && filters?.length > 0 && (
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center space-x-2 px-3 py-2 border border-border rounded-md hover:bg-muted transition-smooth ${
                activeFilters?.length > 0 ? 'bg-primary/10 border-primary text-primary' : ''
              }`}
            >
              <Icon name="Filter" size={16} />
              <span className="text-sm">Filtros</span>
              {activeFilters?.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                  {activeFilters?.length}
                </span>
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-md shadow-soft z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-medium text-popover-foreground">
                    Filtros de búsqueda
                  </h3>
                </div>
                
                <div className="py-2">
                  {filters?.map((filter) => (
                    <label
                      key={filter?.id}
                      className="flex items-center px-4 py-2 hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={activeFilters?.includes(filter?.id)}
                        onChange={() => handleFilterToggle(filter?.id)}
                        className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0 mr-3"
                      />
                      <div>
                        <p className="text-sm text-popover-foreground">
                          {filter?.label}
                        </p>
                        {filter?.description && (
                          <p className="text-xs text-muted-foreground">
                            {filter?.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {activeFilters?.length > 0 && (
                  <div className="px-4 py-3 border-t border-border">
                    <button
                      onClick={() => {
                        setActiveFilters([]);
                        if (onSearch) {
                          onSearch(searchTerm, []);
                        }
                      }}
                      className="text-sm text-destructive hover:text-destructive/80 transition-smooth"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Active filters display */}
      {activeFilters?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters?.map((filterId) => {
            const filter = filters?.find(f => f?.id === filterId);
            return filter ? (
              <span
                key={filterId}
                className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
              >
                {filter?.label}
                <button
                  onClick={() => handleFilterToggle(filterId)}
                  className="ml-1 hover:text-primary/80"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;