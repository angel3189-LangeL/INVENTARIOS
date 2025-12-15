import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { SearchableSelect } from '../components/SearchableSelect';
import { SortConfig, ProductRow } from '../types';
import { ArrowUpDown, AlertCircle, Search, FilterX, Tag } from 'lucide-react';
import { getColorForValue } from '../utils/csvParser';

export const InventoryPage: React.FC = () => {
  const { data, uniqueStores, uniqueBrands } = useData();
  
  // Filters
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State to track if we have already set the default store to avoid overwriting user choice
  const hasSetDefaultStore = useRef(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'STOCK', direction: null });

  // 1. Calculate Top Store and set as default on mount (only once)
  useEffect(() => {
    if (data.length > 0 && !hasSetDefaultStore.current) {
        // Calculate sales per store
        const salesByStore: Record<string, number> = {};
        data.forEach(row => {
            const store = row['DESCRIPCION LOCAL2'];
            if (store) {
                salesByStore[store] = (salesByStore[store] || 0) + row.VTA;
            }
        });

        // Find store with max sales
        const topStore = Object.keys(salesByStore).reduce((a, b) => 
            salesByStore[a] > salesByStore[b] ? a : b
        , '');

        if (topStore) {
            setSelectedStore(topStore);
        }
        hasSetDefaultStore.current = true;
    }
  }, [data]);

  // Compute filtered & sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Filter by Store
    if (selectedStore) {
      filtered = filtered.filter(row => row['DESCRIPCION LOCAL2'] === selectedStore);
    }
    
    // Filter by Brand
    if (selectedBrand) {
      filtered = filtered.filter(row => row.MARCA === selectedBrand);
    }

    // Filter by Search Query (SKU or Description)
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(row => 
            row.COD.toString().toLowerCase().includes(query) || 
            row.DESCRIPCION.toLowerCase().includes(query)
        );
    }

    // Sort logic: Always Group by Brand first, then sort by selected key within brand
    return [...filtered].sort((a, b) => {
        // 1. Primary Sort: Brand (A-Z) to keep them grouped
        const brandA = a.MARCA || '';
        const brandB = b.MARCA || '';
        const brandComparison = brandA.localeCompare(brandB);
        
        if (brandComparison !== 0) {
            return brandComparison;
        }

        // 2. Secondary Sort: Selected Column (Stock/Vta)
        if (sortConfig.key && sortConfig.direction) {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

  }, [data, selectedStore, selectedBrand, searchQuery, sortConfig]);

  const handleSort = (key: keyof ProductRow) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleClearFilters = () => {
      setSelectedStore('');
      setSelectedBrand('');
      setSearchQuery('');
  };

  // Min/Max for color scaling
  const maxStock = 100;
  const maxSales = 50;

  return (
    <div className="space-y-2">
      {/* Filters Sticky Section - COMPACTADO */}
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 sticky top-14 sm:top-16 z-40">
        <div className="flex justify-between items-center mb-1.5">
             <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center">
                <Search className="w-4 h-4 mr-1 text-blue-600"/>
                Filtros
             </h2>
             <button 
                onClick={handleClearFilters}
                className="text-[10px] sm:text-xs text-red-600 hover:text-red-800 flex items-center font-medium transition-colors border border-red-100 px-2 py-0.5 rounded bg-red-50"
             >
                 <FilterX className="w-3 h-3 mr-1" />
                 Limpiar
             </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          
          {/* 1. Store Filter */}
          <div className="w-full">
            <SearchableSelect
                label="Tienda"
                options={uniqueStores}
                value={selectedStore}
                onChange={setSelectedStore}
                placeholder="Todas..."
            />
          </div>

          {/* 2. Brand Filter */}
          <div className="w-full">
             <label className="block text-xs font-bold text-gray-700 mb-0.5">Marca</label>
             <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                     <Tag className="h-3 w-3 text-gray-400" />
                 </div>
                 <select
                    className="block w-full pl-8 pr-6 py-1.5 text-xs border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border bg-white text-gray-900 h-8 sm:h-9"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                 >
                    <option value="">Todas...</option>
                    {uniqueBrands.map((brand) => (
                        <option key={brand} value={brand}>
                            {brand}
                        </option>
                    ))}
                 </select>
             </div>
          </div>

          {/* 3. General Search */}
          <div className="w-full relative">
             <label className="block text-xs font-bold text-gray-700 mb-0.5">Buscar</label>
             <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Search className="h-3 w-3 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 text-xs border-gray-300 rounded-md py-1.5 border bg-white text-gray-900 h-8 sm:h-9"
                    placeholder="SKU o Descripción..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

        </div>
      </div>

      {/* No Results State */}
      {processedData.length === 0 && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-8 w-8 text-gray-300 mb-1" />
                    <p className="text-sm">No hay datos.</p>
                </div>
          </div>
      )}

      {/* TABLE VIEW (Compact Mobile / Standard Desktop) */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full table-fixed sm:table-auto">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider w-16 sm:w-auto">Marca</th>
                <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider w-14 sm:w-auto">SKU</th>
                <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider w-auto">Descripción</th>
                <th 
                  className="px-1 py-1 sm:px-6 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group w-12 sm:w-28"
                  onClick={() => handleSort('STOCK')}
                >
                  <div className="flex items-center justify-center flex-col sm:flex-row">
                    Stock
                    <ArrowUpDown className="hidden sm:block ml-1 h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                  </div>
                </th>
                <th 
                  className="px-1 py-1 sm:px-6 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group w-12 sm:w-28"
                  onClick={() => handleSort('VTA')}
                >
                  <div className="flex items-center justify-center flex-col sm:flex-row">
                    Vta
                    <span className="hidden sm:inline ml-1">30D</span>
                    <ArrowUpDown className="hidden sm:block ml-1 h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
                {processedData.map((row, idx) => {
                  const showBrand = idx === 0 || row.MARCA !== processedData[idx - 1].MARCA;
                  
                  // Brand separator: Full line (Gray 300)
                  // Item separator: Partial line (Gray 100)
                  
                  const brandBorder = showBrand 
                    ? "border-t border-gray-300" 
                    : "border-none";
                    
                  const itemBorder = showBrand 
                    ? "border-t border-gray-300"
                    : "border-t border-gray-100";

                  return (
                    <tr key={`${row.COD}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className={`px-1 py-1.5 sm:px-6 sm:py-4 whitespace-normal sm:whitespace-nowrap text-[10px] sm:text-sm font-bold text-slate-700 align-top ${brandBorder}`}>
                        {showBrand ? row.MARCA : ''}
                      </td>
                      <td className={`px-1 py-1.5 sm:px-6 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-gray-500 font-mono align-top ${itemBorder}`}>
                        {row.COD}
                      </td>
                      <td className={`px-1 py-1.5 sm:px-6 sm:py-4 text-[10px] sm:text-sm text-gray-900 align-top ${itemBorder}`}>
                        <div className="line-clamp-2 leading-tight sm:line-clamp-none">
                            {row.DESCRIPCION}
                        </div>
                      </td>
                      <td className={`px-1 py-1.5 sm:px-6 sm:py-4 whitespace-nowrap text-center align-top ${itemBorder}`}>
                         <span className={getColorForValue(row.STOCK, 0, maxStock, 'stock')}>
                            {row.STOCK}
                         </span>
                      </td>
                      <td className={`px-1 py-1.5 sm:px-6 sm:py-4 whitespace-nowrap text-center align-top ${itemBorder}`}>
                         <span className={getColorForValue(row.VTA, 0, maxSales, 'sales')}>
                            {row.VTA}
                         </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="bg-gray-50 p-2 rounded text-[10px] sm:text-xs text-gray-500 flex justify-between items-center border border-gray-200">
            <span>{processedData.length} registros</span>
            {selectedStore && <span className="font-semibold text-blue-600 truncate max-w-[150px]">{selectedStore}</span>}
      </div>
    </div>
  );
};