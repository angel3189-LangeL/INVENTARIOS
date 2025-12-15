import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SearchableSelect } from '../components/SearchableSelect';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { BarChart3 } from 'lucide-react';

const CustomizedYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const text = payload.value || '';
  // Width increased to ~150px. Approx 6-7px per char => ~24 chars
  const maxChars = 24; 
  
  // Hack: replace hyphens with hyphen+space to allow split(' ') to wrap these words
  const safeText = text.replace(/-/g, '- ');
  
  const words = safeText.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    // Check if adding word exceeds max chars
    if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  // Max 2 lines logic
  const displayLines = lines.slice(0, 2);
  if (lines.length > 2) {
      // Add ellipsis to 2nd line if there were more
      const lastLine = displayLines[1];
      displayLines[1] = lastLine.length > (maxChars - 3) ? lastLine.substring(0, maxChars - 3) + '...' : lastLine + '...';
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {displayLines.map((line, index) => (
        <text 
            key={index} 
            x={-5} 
            y={0} 
            dy={displayLines.length === 1 ? 4 : (index === 0 ? -4 : 8)} 
            textAnchor="end" 
            fill="#4b5563" 
            fontSize={9}
            fontWeight={500}
        >
          {line.trim()}
        </text>
      ))}
      {/* Línea marca de agua separadora */}
      <line x1={-150} y1={24} x2={0} y2={24} stroke="#cbd5e1" strokeWidth={1} strokeOpacity={0.5} />
    </g>
  );
};

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

    // We allow full names now, handled by the CustomYAxisTick
    return Array.from(prodMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [filteredData]);

  // Generators for Monochromatic scales (Darker to Lighter)
  // Blue Hue: ~220. Lightness from 30% (Dark) to 70% (Light)
  const getBlueColor = (index: number, total: number) => {
    const startL = 30; 
    const endL = 75;
    const l = startL + (index / total) * (endL - startL);
    return `hsl(215, 90%, ${l}%)`;
  };

  // Green Hue: ~150. Lightness from 25% (Dark) to 65% (Light)
  const getGreenColor = (index: number, total: number) => {
    const startL = 25; 
    const endL = 70;
    const l = startL + (index / total) * (endL - startL);
    return `hsl(150, 85%, ${l}%)`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 sticky top-14 sm:top-16 z-40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-1">
             <div>
                 <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                    Ranking de Ventas
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-500 ml-7">Acumulado últimos 30 días</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chart 1: Tiendas (BLUE SCALE) */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-2 text-center">Top 15 Tiendas (Venta 30 Días)</h3>
          {/* Aumentada altura móvil a 750px para dar espacio a etiquetas */}
          <div className="h-[750px] sm:h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStoresData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={130} 
                    tick={{fontSize: 9, fill: '#4b5563'}} 
                    interval={0} 
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {topStoresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBlueColor(index, topStoresData.length)} />
                    ))}
                    <LabelList 
                        dataKey="value" 
                        position="insideRight" 
                        fill="white" 
                        fontSize={10} 
                        fontWeight="bold"
                        offset={10}
                    />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Productos (GREEN SCALE) */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-2 text-center">Top 15 Productos (Venta 30 Días)</h3>
          {/* Aumentada altura móvil a 750px para dar espacio a etiquetas */}
          <div className="h-[750px] sm:h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={150} 
                    tick={<CustomizedYAxisTick />}
                    interval={0} 
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {topProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getGreenColor(index, topProductsData.length)} />
                    ))}
                    <LabelList 
                        dataKey="value" 
                        position="insideRight" 
                        fill="white" 
                        fontSize={10} 
                        fontWeight="bold"
                        offset={10}
                    />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};