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
    <div className="space-y-2">
      <div className="bg-white p-2 rounded-lg shadow-sm border-l-4 border-red-500 sticky top-14 sm:top-16 z-40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-1">
           <div>
             <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center">
               <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
               Top Negativos
             </h2>
             <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Productos con stock negativo</p>
           </div>
           <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full md:w-auto">
             <div className="w-full sm:w-48">
                <SearchableSelect
                    options={uniqueFormats}
                    value={selectedFormat}
                    onChange={setSelectedFormat}
                    placeholder="Formato"
                />
             </div>
             <div className="w-full sm:w-48">
                <SearchableSelect
                    options={uniqueBrands}
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                    placeholder="Marca"
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
            {/* TABLE VIEW (Compact Mobile / Standard Desktop) */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full divide-y divide-gray-200 table-fixed sm:table-auto">
                    <thead className="bg-red-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-red-700 uppercase tracking-wider w-16 sm:w-auto">Tienda</th>
                        <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-red-700 uppercase tracking-wider w-14 sm:w-auto">Marca</th>
                        <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-red-700 uppercase tracking-wider w-auto">Descripción</th>
                        <th className="px-1 py-1 sm:px-6 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-red-700 uppercase tracking-wider w-12 sm:w-24">Stock</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {negativeData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-1 py-1.5 sm:px-6 sm:py-4 text-[10px] sm:text-sm text-gray-900 font-medium align-top">
                                <div className="line-clamp-2 leading-tight">
                                    {row['DESCRIPCION LOCAL2']}
                                </div>
                            </td>
                            <td className="px-1 py-1.5 sm:px-6 sm:py-4 text-[10px] sm:text-sm text-gray-600 align-top truncate">
                                {row.MARCA}
                            </td>
                            <td className="px-1 py-1.5 sm:px-6 sm:py-4 text-[10px] sm:text-sm text-gray-500 align-top">
                                <div className="line-clamp-2 leading-tight sm:line-clamp-none">
                                    {row.DESCRIPCION}
                                </div>
                            </td>
                            <td className="px-1 py-1.5 sm:px-6 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-center font-bold text-red-600 align-top">
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