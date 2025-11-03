import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "../../utils/cn";

const SelectSimple = ({
    className,
    options = [],
    value,
    defaultValue,
    placeholder = "Select an option",
    multiple = false,
    disabled = false,
    required = false,
    label,
    description,
    error,
    searchable = false,
    clearable = false,
    loading = false,
    id,
    name,
    onChange,
    onOpenChange,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const selectRef = useRef(null);

    // Close select when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm("");
                onOpenChange?.(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchTerm("");
                onOpenChange?.(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onOpenChange]);

    // Función mejorada de búsqueda para SelectSimple
    const removeAccents = (text) => {
        return text?.normalize('NFD')?.replace(/[\u0300-\u036f]/g, '') || '';
    };

    const normalizeText = (text) => {
        return removeAccents(text || '')?.toLowerCase()?.trim();
    };

    const normalizeSearchTerm = (term) => {
        // Normalización más agresiva: sin acentos y sin espacios para coincidencias flexibles
        return removeAccents(term || '')?.toLowerCase()?.replace(/\s+/g, '')?.trim();
    };

    const matchesSearchTerm = (searchTerm, option) => {
        if (!searchTerm) return true;
        
        const normalizedSearch = normalizeSearchTerm(searchTerm);
        
        // Campos a buscar
        const searchFields = [
            option?.label,
            option?.value?.toString(),
            option?.description,
            // Permitir campos adicionales como keywords o meta
            ...(Array.isArray(option?.keywords) ? option.keywords : []),
            ...(option?.meta && typeof option.meta === 'object' ? Object.values(option.meta) : [])
        ];
        
        return searchFields.some(field => {
            if (!field) return false;
            
            const normalizedFieldAggressive = normalizeSearchTerm(field);

            // Coincidencia agresiva (sin espacios ni acentos)
            if (normalizedFieldAggressive.includes(normalizedSearch)) {
                return true;
            }

            // Coincidencia relajada (manteniendo espacios pero sin acentos)
            if (normalizeText(field).includes(normalizeText(searchTerm))) {
                return true;
            }

            // Búsqueda por palabras individuales, ambas normalizadas sin acentos
            const fieldWords = normalizeText(field).split(/\s+/);
            const searchWords = normalizeText(searchTerm).split(/\s+/);

            return searchWords.every(searchWord => 
                fieldWords.some(fieldWord => fieldWord.includes(searchWord))
            );
        });
    };

    // Filter options based on search
    const filteredOptions = searchable && searchTerm
        ? options?.filter(option => matchesSearchTerm(searchTerm, option))
        : options;

    // Get selected option(s) for display
    const getSelectedDisplay = () => {
        if (!value) return placeholder;

        if (multiple) {
            const selectedOptions = options?.filter(opt => value?.includes(opt?.value));
            if (selectedOptions?.length === 0) return placeholder;
            if (selectedOptions?.length === 1) return selectedOptions?.[0]?.label;
            // Mostrar los nombres de los usuarios seleccionados en lugar de "X items selected"
            return selectedOptions.map(opt => opt?.label).join(', ');
        }

        const selectedOption = options?.find(opt => opt?.value === value);
        return selectedOption ? selectedOption?.label : placeholder;
    };

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            onOpenChange?.(!isOpen);
            if (!isOpen) {
                setSearchTerm("");
            }
        }
    };

    const handleInputChange = (e) => {
        if (searchable && isOpen) {
            setSearchTerm(e.target.value);
        }
    };

    const handleOptionSelect = (option) => {
        if (multiple) {
            const newValue = value || [];
            const updatedValue = newValue?.includes(option?.value)
                ? newValue?.filter(v => v !== option?.value)
                : [...newValue, option?.value];
            onChange?.(updatedValue);
        } else {
            onChange?.(option?.value);
            setIsOpen(false);
            onOpenChange?.(false);
        }
    };

    const handleClear = (e) => {
        e?.stopPropagation();
        onChange?.(multiple ? [] : '');
    };

    const isSelected = (optionValue) => {
        if (multiple) {
            return value?.includes(optionValue) || false;
        }
        return value === optionValue;
    };

    const hasValue = multiple ? value?.length > 0 : value !== undefined && value !== '';

    return (
        <div ref={selectRef} className={cn("relative", className)}>
            {label && (
                <label
                    htmlFor={id}
                    className={cn(
                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block",
                        error ? "text-destructive" : "text-foreground"
                    )}
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {searchable && isOpen ? (
                    <div className="relative">
                        <input
                            id={id}
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            placeholder={placeholder}
                            className={cn(
                                "flex h-10 w-full items-center rounded-md border border-input bg-white text-black px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                error && "border-destructive focus:ring-destructive"
                            )}
                            disabled={disabled}
                            autoFocus
                        />
                        <div 
                            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                            onClick={handleToggle}
                        >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                ) : (
                    <button
                        id={id}
                        type="button"
                        className={cn(
                            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white text-black px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            error && "border-destructive focus:ring-destructive",
                            !hasValue && "text-muted-foreground"
                        )}
                        onClick={handleToggle}
                        disabled={disabled}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        {...props}
                    >
                        <span className="truncate">{getSelectedDisplay()}</span>

                        <div className="flex items-center gap-1">
                            {loading && (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}

                            {clearable && hasValue && !loading && (
                                <button
                                    type="button"
                                    className="h-4 w-4 hover:bg-gray-200 rounded"
                                    onClick={handleClear}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}

                            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        </div>
                    </button>
                )}

                {/* Hidden native select for form submission */}
                <select
                    name={name}
                    value={value || ''}
                    onChange={() => { }} // Controlled by our custom logic
                    className="sr-only"
                    tabIndex={-1}
                    multiple={multiple}
                    required={required}
                >
                    <option value="">Select...</option>
                    {options?.map(option => (
                        <option key={option?.value} value={option?.value}>
                            {option?.label}
                        </option>
                    ))}
                </select>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white text-black border-0 rounded-md shadow-md">
                        <div className="py-1 max-h-60 overflow-auto">
                            {filteredOptions?.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    {searchTerm ? 'No options found' : 'No options available'}
                                </div>
                            ) : (
                                filteredOptions?.map((option) => (
                                    <div
                                        key={option?.value}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                            isSelected(option?.value) && "bg-primary text-primary-foreground",
                                            option?.disabled && "pointer-events-none opacity-50"
                                        )}
                                        onClick={() => !option?.disabled && handleOptionSelect(option)}
                                    >
                                        <span className="flex-1">{option?.label}</span>
                                        {multiple && isSelected(option?.value) && (
                                            <Check className="h-4 w-4" />
                                        )}
                                        {option?.description && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {option?.description}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            {description && !error && (
                <p className="text-sm text-muted-foreground mt-1">
                    {description}
                </p>
            )}
            {error && (
                <p className="text-sm text-destructive mt-1">
                    {error}
                </p>
            )}
        </div>
    );
};

export default SelectSimple;
