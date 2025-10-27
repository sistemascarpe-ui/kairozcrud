// components/ui/Select.jsx - Shadcn style Select
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./Button";
import Input from "./Input";

// Global state to manage which select is open
let globalOpenSelectId = null;
const selectListeners = new Set();

const notifySelects = (openSelectId) => {
    selectListeners.forEach(listener => listener(openSelectId));
};

const Select = React.forwardRef(({
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
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const selectRef = useRef(null);

    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random()?.toString(36)?.substr(2, 9)}`;

    // Listen for global select state changes
    useEffect(() => {
        const handleGlobalSelectChange = (openSelectId) => {
            setIsOpen(openSelectId === selectId);
        };

        selectListeners.add(handleGlobalSelectChange);

        return () => {
            selectListeners.delete(handleGlobalSelectChange);
        };
    }, [selectId]);

    // Close select when clicking outside or pressing Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            // Verificar si el click es fuera del select
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                console.log('Click outside detected, closing select');
                globalOpenSelectId = null;
                notifySelects(null);
                setSearchTerm("");
                onOpenChange?.(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                console.log('Escape pressed, closing select');
                globalOpenSelectId = null;
                notifySelects(null);
                setSearchTerm("");
                onOpenChange?.(false);
            }
        };

        // Agregar listeners inmediatamente
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, selectId, onOpenChange]);

    // Función mejorada de búsqueda para Select
    const normalizeSearchTerm = (term) => {
        return term?.toLowerCase()?.replace(/\s+/g, '')?.trim();
    };

    const matchesSearchTerm = (searchTerm, option) => {
        if (!searchTerm) return true;
        
        const normalizedSearch = normalizeSearchTerm(searchTerm);
        
        // Campos a buscar
        const searchFields = [
            option?.label,
            option?.value?.toString()
        ];
        
        return searchFields.some(field => {
            if (!field) return false;
            
            const normalizedField = normalizeSearchTerm(field);
            
            // Búsqueda exacta sin espacios
            if (normalizedField.includes(normalizedSearch)) {
                return true;
            }
            
            // Búsqueda con espacios originales
            if (field.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }
            
            // Búsqueda por palabras individuales
            const fieldWords = field.toLowerCase().split(/\s+/);
            const searchWords = searchTerm.toLowerCase().split(/\s+/);
            
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
            return `${selectedOptions?.length} items selected`;
        }

        const selectedOption = options?.find(opt => opt?.value === value);
        return selectedOption ? selectedOption?.label : placeholder;
    };

    const handleToggle = (e) => {
        e?.stopPropagation();
        if (!disabled) {
            if (globalOpenSelectId === selectId) {
                // Close this select
                console.log('Closing select via toggle');
                globalOpenSelectId = null;
                notifySelects(null);
                setSearchTerm("");
                onOpenChange?.(false);
            } else {
                // Open this select and close others
                console.log('Opening select via toggle');
                globalOpenSelectId = selectId;
                notifySelects(selectId);
                onOpenChange?.(true);
            }
        }
    };

    const handleInputChange = (e) => {
        if (searchable && isOpen) {
            setSearchTerm(e.target.value);
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Escape') {
            // Cerrar el select
            globalOpenSelectId = null;
            notifySelects(null);
            setSearchTerm("");
        }
    };

    const handleInputClick = (e) => {
        e.stopPropagation();
        // No hacer nada aquí, el input debe permitir escribir
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
            globalOpenSelectId = null;
            notifySelects(null);
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
                    htmlFor={selectId}
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
                            ref={ref}
                            id={selectId}
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            onClick={handleInputClick}
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
                        ref={ref}
                        id={selectId}
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={handleClear}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
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
});

Select.displayName = "Select";

export default Select;