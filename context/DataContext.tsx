import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ProductRow } from '../types';
import { parseCSV } from '../utils/csvParser';

// ------------------------------------------------------------------
// CONFIGURACIÓN DE URL DEL CSV (LINK GITHUB)
// ------------------------------------------------------------------
// INSTRUCCIONES:
// 1. Sube tu archivo CSV a GitHub.
// 2. Abre el archivo en GitHub y dale clic al botón "Raw" (Crudo).
// 3. Copia esa URL y pégala abajo en la variable TARGET_GITHUB_URL.
//
// Ejemplo: "https://raw.githubusercontent.com/usuario/repo/main/inventario.csv"
//
// NOTA: Para probar la app ahora mismo, he dejado una "Data URI" con datos de ejemplo.
// Borra todo el string largo y pon tu link entre comillas.
// ------------------------------------------------------------------

const TARGET_GITHUB_URL = "data:text/csv;charset=utf-8;base64,Q0FERU5BO0NORDtERVNDUklQQ0lPTjtNQVJDQTtDT0QgTE9DQUw7REVTQ1JJUENJT04gTE9DQUw7Rk9STUFUTztWVEE7U1RPQ0s7REVTQ1JJUENJT04gTE9DQUwyCkNBREVOQSBBOzEwMDExO1BvbG8gQmFzaWNvO0FETUlEO0wwMTtDRU5UUkFMO1RJRU5EQTsxMDs1O1RJRU5EQSBDRU5UUkFMCkNBREVOQSBBOzEwMDEyO1BhbnRhbG9uIEplYW47TEVWSVM7TDAxO0NFTlRSQUw7VElFTkRBOzU7LTI7VElFTkRVIENFTlRSQUwKQ0FERU5BIEE7MTAwMTM7Q2FtaXNhIEZvcm1hbDtZVkVTO0wwMTtDRU5UUkFMO1RJRU5EQTs0MDs4MDtUSUVuREEgQ0VOVFJBRApDQURFTkEgQTsxMDAxNDtTaG9ydCBEZXBvcnRpdm87QURJREFTO0wwMjtOT1JURTtUSUVuREE7Mjg7MTU7VElFTkRBIE5PUlRFCkNBREVOQSBBOzEwMDE1O1phcGF0aWxsYXMgUnVuO05JS0U7TDAyO05PUlRFO1RJRU5EQTs2MDsxMTA7VElFTkRBIE5PUlRFCkNBREVOQSBBOzEwMDE2O1BvbGVyYSBBbGdvZG9uO1RPUFBUO0wwMjtOT1JURTtUSUVuREE7Mjs0O1RJRU5EQSBOT1JURQpDQURFTkEgQTsxMDAxNztCbHVzYSBTZWRhO1pBUkE7TDAzO1NVUjtUSUVuREE7MTg7MjU7VElFTkRBIFNVUgpDQURFTkEgQTsxMDAxODtDYXNhY2EgUHVmZjtOT1JUSEZBQ0U7TDAzO1NVUjtUSUVuREE7NDU7NjA7VElFTkRBIFNVUgo=";
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
    // If no URL provided, use default
    const targetUrl = url || TARGET_GITHUB_URL;
    
    if (!targetUrl) return;

    setIsLoading(true);
    try {
      // Basic fetch with CORS handling assumption (GitHub Raw supports CORS)
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const text = await response.text();
      const parsedData = await parseCSV(text);
      
      if (parsedData.length === 0) {
        throw new Error("No se encontraron datos válidos.");
      }
      
      setData(processData(parsedData));
    } catch (error) {
      console.error("Error fetching CSV from URL", error);
      // We do not alert here to avoid annoying popups on load if URL is broken,
      // instead we let the Layout handle the empty state.
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => setData([]);

  // Auto-load data on mount
  useEffect(() => {
    if (TARGET_GITHUB_URL && data.length === 0) {
        loadDataFromUrl(TARGET_GITHUB_URL);
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