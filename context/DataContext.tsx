import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ProductRow } from '../types';
import { parseCSV } from '../utils/csvParser';

// ------------------------------------------------------------------
// CONFIGURACIÓN DE URL DEL CSV (ARCHIVO LOCAL)
// ------------------------------------------------------------------
// Al subir el archivo "INVENTARIO.csv" en la misma carpeta raíz que el index.html,
// podemos acceder a él directamente.
const LOCAL_CSV_FILE = "./SPSA.csv";
// ------------------------------------------------------------------

interface DataContextType {
  data: ProductRow[];
  isLoading: boolean;
  loadData: (file: File) => Promise<void>;
  loadDataFromUrl: (url: string) => Promise<void>;
  resetData: () => void;
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
    setIsLoading(true);
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      const text = await response.text();

      // Basic validation: Check if it looks like HTML (error page) instead of CSV
      if (text.trim().startsWith("<!DOCTYPE html") || text.trim().startsWith("<html")) {
          throw new Error("El archivo no parece ser un CSV válido (se recibió HTML).");
      }

      const parsedData = await parseCSV(text);
      
      if (parsedData.length === 0) {
        console.warn("El CSV cargado está vacío.");
      }
      
      setData(processData(parsedData));
    } catch (error) {
      console.error("Error cargando CSV local:", error);
      // No mostramos alerta intrusiva aquí para permitir que la UI muestre el cargador manual si falla
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => setData([]);

  // Auto-load data on mount
  useEffect(() => {
    if (data.length === 0) {
        loadDataFromUrl(LOCAL_CSV_FILE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoized unique values for filters
  const uniqueStores = useMemo(() => Array.from(new Set(data.map(d => d['DESCRIPCION LOCAL2']).filter(Boolean))).sort(), [data]);
  const uniqueBrands = useMemo(() => Array.from(new Set(data.map(d => d.MARCA).filter(Boolean))).sort(), [data]);
  const uniqueFormats = useMemo(() => Array.from(new Set(data.map(d => d.FORMATO).filter(Boolean))).sort(), [data]);

  return (
    <DataContext.Provider value={{ data, isLoading, loadData, loadDataFromUrl, resetData, uniqueStores, uniqueBrands, uniqueFormats }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};