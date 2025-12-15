import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { SearchableSelect } from '../components/SearchableSelect';
import { SortConfig, ProductRow } from '../types';
import { ArrowUpDown, AlertCircle, Search, FilterX, Store, Tag } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6">
      {/* Filters Sticky Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-14 sm:top-16 z-30">
        <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-600"/>
                Buscador y Filtros
             </h2>
             <button 
                onClick={handleClearFilters}
                className="text-sm text-red-600 hover:text-red-800 flex items-center font-medium transition-colors"
                title="Limpiar todos los filtros"
             >
                 <FilterX className="w-4 h-4 mr-1" />
                 Limpiar Filtros
             </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* 1. Store Filter (Searchable) - Moved First */}
          <div className="lg:col-span-4">
            <SearchableSelect
                label="Tienda"
                options={uniqueStores}
                value={selectedStore}
                onChange={setSelectedStore}
                placeholder="Todas las tiendas..."
            />
          </div>

          {/* 2. Brand Filter (Standard Select) - Moved Second */}
          <div className="lg:col-span-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
             <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Tag className="h-4 w-4 text-gray-400" />
                 </div>
                 <select
                    className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-white text-gray-900"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                 >
                    <option value="">Todas las marcas...</option>
                    {uniqueBrands.map((brand) => (
                        <option key={brand} value={brand}>
                            {brand}
                        </option>
                    ))}
                 </select>
             </div>
          </div>

          {/* 3. General Search (SKU / Description) - Moved Last */}
          <div className="lg:col-span-4 relative">
             <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Producto</label>
             <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border bg-white text-gray-900"
                    placeholder="SKU o Descripción..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Marca</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group text-center"
                  onClick={() => handleSort('STOCK')}
                >
                  <div className="flex items-center justify-center">
                    Stock
                    <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group text-center"
                  onClick={() => handleSort('VTA')}
                >
                  <div className="flex items-center justify-center">
                    VTA 30 DÍAS
                    <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                      <p>No hay datos que coincidan con los filtros seleccionados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedData.map((row, idx) => {
                  // Only show Brand if it's the first row or different from the previous row
                  const showBrand = idx === 0 || row.MARCA !== processedData[idx - 1].MARCA;
                  return (
                    <tr key={`${row.COD}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-slate-700">
                        {showBrand ? row.MARCA : ''}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 font-mono">
                        {row.COD}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 min-w-[150px] max-w-xs truncate" title={row.DESCRIPCION}>
                        {row.DESCRIPCION}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                         <span className={getColorForValue(row.STOCK, 0, maxStock, 'stock')}>
                            {row.STOCK}
                         </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                         <span className={getColorForValue(row.VTA, 0, maxSales, 'sales')}>
                            {row.VTA}
                         </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
            <span>Mostrando {processedData.length} registros</span>
            {selectedStore && <span className="font-semibold text-blue-600 truncate max-w-[200px]">{selectedStore}</span>}
        </div>
      </div>
    </div>
  );
};