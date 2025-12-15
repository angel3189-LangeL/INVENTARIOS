import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SearchableSelect } from '../components/SearchableSelect';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

export const SalesRankingPage: React.FC = () => {
  const { data, uniqueFormats, uniqueBrands } = useData();
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Common filtering
  const filteredData = useMemo(() => {
    let filtered = data;
    if (selectedFormat) filtered = filtered.filter(d => d.FORMATO === selectedFormat);
    if (selectedBrand) filtered = filtered.filter(d => d.MARCA === selectedBrand);
    return filtered;
  }, [data, selectedFormat, selectedBrand]);

  // Chart 1: Top 15 Stores by VTA
  const topStoresData = useMemo(() => {
    const storeMap = new Map<string, number>();
    filteredData.forEach(d => {
      const store = d['DESCRIPCION LOCAL2'];
      const val = d.VTA;
      if (store) {
        storeMap.set(store, (storeMap.get(store) || 0) + val);
      }
    });

    return Array.from(storeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [filteredData]);

  // Chart 2: Top 15 Products by VTA
  const topProductsData = useMemo(() => {
    const prodMap = new Map<string, number>();
    filteredData.forEach(d => {
      const prod = d.DESCRIPCION;
      const val = d.VTA;
      if (prod) {
        prodMap.set(prod, (prodMap.get(prod) || 0) + val);
      }
    });

    // Shorten product names for mobile display
    return Array.from(prodMap.entries())
      .map(([name, value]) => {
          // Keep name reasonably short for charts
          const shortName = name.length > 25 ? name.substring(0, 25) + '...' : name;
          return { name: shortName, fullName: name, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [filteredData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
             <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
                Ranking de Ventas
            </h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chart 1 */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-2 text-center">Top 15 Tiendas (Mayor Venta)</h3>
          <div className="h-[400px] sm:h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStoresData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={130} 
                    tick={{fontSize: 10, fill: '#4b5563'}} 
                    interval={0} 
                />
                <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                    formatter={(value: number) => [`${value} unidades`, 'Ventas']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {topStoresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-2 text-center">Top 15 Productos (Mayor Venta)</h3>
          <div className="h-[400px] sm:h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={130} 
                    tick={{fontSize: 10, fill: '#4b5563'}} 
                    interval={0} 
                />
                 <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                    formatter={(value: number) => [`${value} unidades`, 'Ventas']}
                    labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                            return payload[0].payload.fullName;
                        }
                        return label;
                    }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {topProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};