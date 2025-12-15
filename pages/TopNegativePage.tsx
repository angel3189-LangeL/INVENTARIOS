import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SearchableSelect } from '../components/SearchableSelect';
import { TrendingDown, AlertTriangle } from 'lucide-react';

export const TopNegativePage: React.FC = () => {
  const { data, uniqueFormats, uniqueBrands } = useData();
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  const negativeData = useMemo(() => {
    let filtered = data.filter(d => d.STOCK < 0);
    
    if (selectedFormat) {
      filtered = filtered.filter(d => d.FORMATO === selectedFormat);
    }
    if (selectedBrand) {
      filtered = filtered.filter(d => d.MARCA === selectedBrand);
    }
    
    // Sort STOCK from smallest (most negative) to largest
    return filtered.sort((a, b) => a.STOCK - b.STOCK);
  }, [data, selectedFormat, selectedBrand]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
           <div>
             <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
               <TrendingDown className="h-6 w-6 text-red-500 mr-2" />
               Top Negativos
             </h2>
             <p className="text-xs sm:text-sm text-gray-500">Productos con stock negativo</p>
           </div>
           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="w-full sm:w-56">
                <SearchableSelect
                    options={uniqueFormats}
                    value={selectedFormat}
                    onChange={setSelectedFormat}
                    placeholder="Filtro: Formato"
                />
             </div>
             <div className="w-full sm:w-56">
                <SearchableSelect
                    options={uniqueBrands}
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                    placeholder="Filtro: Marca"
                />
             </div>
           </div>
        </div>
      </div>

      {negativeData.length === 0 ? (
         <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
            <div className="flex flex-col items-center text-gray-500">
                <AlertTriangle className="h-10 w-10 text-green-500 mb-2" />
                <p className="font-medium">¡Todo en orden!</p>
                <p className="text-sm">No hay stocks negativos para este criterio.</p>
            </div>
         </div>
      ) : (
        <>
            {/* MOBILE CARD VIEW */}
            <div className="block sm:hidden space-y-3">
                {negativeData.map((row, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-600 relative">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-800 text-sm truncate pr-2">{row['DESCRIPCION LOCAL2']}</span>
                            <span className="text-xs font-semibold text-gray-500">{row.MARCA}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 leading-snug">
                            {row.DESCRIPCION}
                        </div>
                        <div className="flex justify-end border-t border-gray-100 pt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 uppercase font-semibold">Stock Crítico:</span>
                                <span className="font-bold text-red-600 text-base">{row.STOCK}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Tienda</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Marca</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-red-700 uppercase tracking-wider">Stock</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {negativeData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row['DESCRIPCION LOCAL2']}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.MARCA}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 min-w-[200px]">{row.DESCRIPCION}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                                {row.STOCK}
                            </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </>
      )}
    </div>
  );
};