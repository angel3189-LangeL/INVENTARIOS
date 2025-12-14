import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SearchableSelect } from '../components/SearchableSelect';
import { SortConfig, ProductRow } from '../types';
import { ArrowUpDown, AlertCircle } from 'lucide-react';
import { getColorForValue } from '../utils/csvParser';

export const InventoryPage: React.FC = () => {
  const { data, uniqueStores, uniqueBrands } = useData();
  
  // Filters
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'STOCK', direction: null });

  // Compute filtered & sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    if (selectedStore) {
      filtered = filtered.filter(row => row['DESCRIPCION LOCAL2'] === selectedStore);
    }
    if (selectedBrand) {
      filtered = filtered.filter(row => row.MARCA === selectedBrand);
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

  }, [data, selectedStore, selectedBrand, sortConfig]);

  const handleSort = (key: keyof ProductRow) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Min/Max for color scaling (passed dummy values as the new logic is threshold based)
  const maxStock = 100;
  const maxSales = 50;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters Sticky Section */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 sticky top-14 sm:top-16 z-30">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Filtros de Inventario</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <SearchableSelect
            label="TIENDA"
            options={uniqueStores}
            value={selectedStore}
            onChange={setSelectedStore}
            placeholder="Buscar tienda..."
          />
          <SearchableSelect
            label="MARCA"
            options={uniqueBrands}
            value={selectedBrand}
            onChange={setSelectedBrand}
            placeholder="Seleccionar marca..."
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleSort('STOCK')}
                >
                  <div className="flex items-center">
                    Stock
                    <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleSort('VTA')}
                >
                  <div className="flex items-center">
                    VTA 30 DÍAS
                    <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400 group-hover:text-gray-600" />
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
                    <tr key={`${row.COD}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-700">
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
        <div className="px-3 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            Mostrando {processedData.length} registros
        </div>
      </div>
    </div>
  );
};