import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  label 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      <div 
        className="w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`block truncate ${!value ? 'text-gray-400' : 'text-gray-900'}`}>
          {value || placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-1 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-300 focus:ring-0 sm:text-sm"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
          </div>

          <div 
             className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-gray-500"
             onClick={() => {
               onChange("");
               setIsOpen(false);
               setSearchTerm("");
             }}
          >
             <span className="font-normal italic">Todos / Limpiar</span>
          </div>

          {filteredOptions.length === 0 ? (
            <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-700">
              No se encontraron resultados
            </div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <div
                key={`${opt}-${idx}`}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${value === opt ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-gray-900'}`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
              >
                <span className="block truncate">{opt}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};