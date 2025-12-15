import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ProductRow } from '../types';
import { parseCSV } from '../utils/csvParser';

// ------------------------------------------------------------------
// CONFIGURACIÓN POR DEFECTO
// ------------------------------------------------------------------
// Enlace oficial a tu repositorio GitHub
const DEFAULT_CLOUD_URL = "https://raw.githubusercontent.com/angel3189-LangeL/INVENTARIOS/main/INVENTARIO.csv";
const STORAGE_URL_KEY = 'app_inventory_csv_url';
// ------------------------------------------------------------------

interface DataContextType {
  data: ProductRow[];
  isLoading: boolean;
  loadData: (file: File) => Promise<void>;
  loadDataFromUrl: (url: string) => Promise<void>;
  resetData: () => void;
  setCustomUrl: (url: string) => void;
  getCustomUrl: () => string;
  uniqueStores: string[];
  uniqueBrands: string[];
  uniqueFormats: string[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to filter global exclusions (CD and CP)
  const processData = (rawData: ProductRow[]) => {
     return rawData.filter(d => d.FORMATO !== 'CD' && d.FORMATO !== 'CP');
  };

  const loadData = async (file: File) => {
    setIsLoading(true);
    try {
      const parsedData = await parseCSV(file);
      setData(processData(parsedData));
    } catch (error) {
      console.error("Error parsing CSV", error);
      alert("Error al leer el archivo CSV.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataFromUrl = async (url: string) => {
    if (!url) return;
    setIsLoading(true);
    
    // 1. Clean URL Logic
    let targetUrl = url.trim();
    
    // Convert GitHub Blob to Raw if needed
    if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
      targetUrl = targetUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    // Remove 'refs/heads/' which usually breaks raw links
    if (targetUrl.includes('raw.githubusercontent.com') && targetUrl.includes('/refs/heads/')) {
        targetUrl = targetUrl.replace('/refs/heads/', '/');
    }

    try {
      let text = '';
      let usedProxy = false;

      try {
         // 2. Attempt Direct Fetch
         const response = await fetch(targetUrl, { cache: 'no-cache' });
         if (!response.ok) throw new Error(`Direct Status ${response.status}`);
         text = await response.text();
      } catch (directError) {
         console.warn(`Carga directa fallida para ${targetUrl}. Intentando vía Proxy CORS...`, directError);
         usedProxy = true;
         
         // 3. Attempt via CORS Proxy (Fallback)
         const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}&disableCache=${Date.now()}`;
         const response = await fetch(proxyUrl);
         if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status}`);
         text = await response.text();
      }

      // 4. Basic Validation
      if (text.trim().startsWith("<!DOCTYPE html") || text.trim().startsWith("<html")) {
          throw new Error("El archivo descargado no es un CSV válido (se recibió HTML). Verifique el enlace.");
      }

      // 5. Parse
      const parsedData = await parseCSV(text);
      
      if (parsedData.length === 0) {
        console.warn("El CSV cargado está vacío.");
      } else {
        console.log(`Datos cargados exitosamente (${parsedData.length} filas). Proxy usado: ${usedProxy}`);
      }
      
      setData(processData(parsedData));
    } catch (error) {
      console.error("Error cargando CSV remoto:", error);
      // No mostramos alert para no bloquear la UI en carga automática
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => setData([]);

  const setCustomUrl = (url: string) => {
      if (url) {
        localStorage.setItem(STORAGE_URL_KEY, url);
        loadDataFromUrl(url);
      } else {
        localStorage.removeItem(STORAGE_URL_KEY);
        loadDataFromUrl(DEFAULT_CLOUD_URL);
      }
  };

  const getCustomUrl = () => {
      return localStorage.getItem(STORAGE_URL_KEY) || DEFAULT_CLOUD_URL;
  };

  // Auto-load data on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_URL_KEY);
    // Use saved URL if exists, otherwise use the DEFAULT
    const targetUrl = savedUrl || DEFAULT_CLOUD_URL;
    
    if (targetUrl && data.length === 0) {
        loadDataFromUrl(targetUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoized unique values for filters
  const uniqueStores = useMemo(() => Array.from(new Set(data.map(d => d['DESCRIPCION LOCAL2']).filter(Boolean))).sort(), [data]);
  const uniqueBrands = useMemo(() => Array.from(new Set(data.map(d => d.MARCA).filter(Boolean))).sort(), [data]);
  const uniqueFormats = useMemo(() => Array.from(new Set(data.map(d => d.FORMATO).filter(Boolean))).sort(), [data]);

  return (
    <DataContext.Provider value={{ 
        data, 
        isLoading, 
        loadData, 
        loadDataFromUrl, 
        resetData, 
        setCustomUrl,
        getCustomUrl,
        uniqueStores, 
        uniqueBrands, 
        uniqueFormats 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};