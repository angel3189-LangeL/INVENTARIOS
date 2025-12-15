import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SearchableSelect } from '../components/SearchableSelect';
import { TrendingUp, PackageCheck } from 'lucide-react';

export const TopOverstockPage: React.FC = () => {
  const { data, uniqueFormats, uniqueBrands } = useData();
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  const overstockData = useMemo(() => {
    let filtered = data.filter(d => d.STOCK > 50);
    
    if (selectedFormat) {
      filtered = filtered.filter(d => d.FORMATO === selectedFormat);
    }
    if (selectedBrand) {
      filtered = filtered.filter(d => d.MARCA === selectedBrand);
    }
    
    // Sort STOCK desc (Mayor a menor)
    return filtered.sort((a, b) => b.STOCK - a.STOCK);
  }, [data, selectedFormat, selectedBrand]);

  return (
    <div className="space-y-2">
       <div className="bg-white p-2 rounded-lg shadow-sm border-l-4 border-green-500 sticky top-14 sm:top-16 z-40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-1">
           <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                Top Sobre Stock
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Productos con stock {'>'} 50 und</p>
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

      {overstockData.length === 0 ? (
         <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
            <div className="flex flex-col items-center text-gray-500">
                <PackageCheck className="h-10 w-10 text-gray-300 mb-2" />
                <p className="font-medium">No hay sobre stock.</p>
                <p className="text-sm">Ningún producto supera las 50 unidades.</p>
            </div>
         </div>
      ) : (
        <>
            {/* TABLE VIEW (Compact Mobile / Standard Desktop) */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full divide-y divide-gray-200 table-fixed sm:table-auto">
                    <thead className="bg-green-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-green-800 uppercase tracking-wider w-16 sm:w-auto">Tienda</th>
                        <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-green-800 uppercase tracking-wider w-14 sm:w-auto">Marca</th>
                        <th className="px-1 py-1 sm:px-6 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-green-800 uppercase tracking-wider w-auto">Descripción</th>
                        <th className="px-1 py-1 sm:px-6 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-green-800 uppercase tracking-wider w-12 sm:w-24">Stock</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {overstockData.map((row, idx) => (
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
                            <td className="px-1 py-1.5 sm:px-6 sm:py-4 whitespace-nowrap text-[10px] sm:text-sm text-center font-bold text-green-700 align-top">
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