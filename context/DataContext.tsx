import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { ProductRow } from '../types';
import { parseCSV } from '../utils/csvParser';

// ------------------------------------------------------------------
// CONFIGURACIÓN POR DEFECTO (GITHUB)
// ------------------------------------------------------------------
// CORRECCIÓN: Eliminado '/refs/heads/' de la URL para compatibilidad con raw.githubusercontent.com
const DEFAULT_CLOUD_URL = "https://raw.githubusercontent.com/angel3189-LangeL/datos-inventario/main/data/csv/INVENTARIO.csv";
// Cambiamos a v3 para limpiar cualquier caché con la URL incorrecta anterior
const STORAGE_URL_KEY = 'app_inventory_csv_url_v3';
const UPDATE_CHECK_INTERVAL = 180000; 
// ------------------------------------------------------------------

interface DataContextType {
  data: ProductRow[];
  isLoading: boolean;
  isUpdateAvailable: boolean;
  currentSha: string; 
  lastCheckTime: Date | null; 
  loadData: (file: File) => Promise<void>;
  loadDataFromUrl: (url: string, forceRefresh?: boolean) => Promise<void>;
  resetData: () => void;
  setCustomUrl: (url: string) => void;
  getCustomUrl: () => string;
  refreshData: () => void;
  checkForUpdates: () => Promise<boolean>; 
  uniqueStores: string[];
  uniqueBrands: string[];
  uniqueFormats: string[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Control de versiones
  const [currentSha, setCurrentSha] = useState<string>('');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const checkIntervalRef = useRef<any>(null);

  const processData = (rawData: ProductRow[]) => {
     return rawData.filter(d => d.FORMATO !== 'CD' && d.FORMATO !== 'CP');
  };

  const getGitHubApiUrl = (rawUrl: string) => {
    let cleanUrl = rawUrl;
    if (cleanUrl.includes('/refs/heads/')) {
        cleanUrl = cleanUrl.replace('/refs/heads/', '/');
    }
    const match = cleanUrl.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
    if (!match) return null;
    const [_, owner, repo, branch, path] = match;
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  };

  const checkGitHubUpdate = async (url: string): Promise<boolean> => {
    setLastCheckTime(new Date());
    const apiUrl = getGitHubApiUrl(url);
    if (!apiUrl) return false;

    console.log("Verificando actualizaciones (GitHub)...");
    try {
      const response = await fetch(apiUrl, { cache: 'no-cache' });
      if (response.ok) {
        const json = await response.json();
        if (currentSha && json.sha && json.sha !== currentSha) {
            console.log("Nueva versión detectada. SHA Antiguo:", currentSha, "SHA Nuevo:", json.sha);
            setIsUpdateAvailable(true);
            return true;
        }
      }
      return false;
    } catch (error) {
      console.warn("Error verificando update:", error);
      return false;
    }
  };

  const checkForUpdates = async () => {
      const url = getCustomUrl();
      if (!url) return false;
      return await checkGitHubUpdate(url);
  };

  const loadData = async (file: File) => {
    setIsLoading(true);
    setIsUpdateAvailable(false);
    setCurrentSha('');
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

    try {
      const parsedData = await parseCSV(file);
      setData(processData(parsedData));
    } catch (error) {
      console.error("Error parsing CSV", error);
      alert("Error al leer el archivo CSV. Revisa el formato.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataFromUrl = async (url: string, forceRefresh: boolean = false) => {
    if (!url) return;
    setIsLoading(true);
    setIsUpdateAvailable(false);
    
    let targetUrl = url.trim();
    
    // CORRECCIÓN: Lógica robusta para limpiar URLs de GitHub
    if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
      targetUrl = targetUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    // Eliminar 'refs/heads/' si está presente en raw.githubusercontent.com
    if (targetUrl.includes('raw.githubusercontent.com') && targetUrl.includes('/refs/heads/')) {
        targetUrl = targetUrl.replace('/refs/heads/', '/');
    }

    try {
      let text = '';
      
      const apiUrl = getGitHubApiUrl(targetUrl);
      if (apiUrl) {
         fetch(apiUrl).then(r => r.json()).then(d => {
             if(d.sha) setCurrentSha(d.sha);
         }).catch(e => console.warn("No SHA available", e));
      } else {
          setCurrentSha('EXTERNAL');
      }

      try {
         let fetchUrl = targetUrl;
         const options: RequestInit = {};

         if (forceRefresh) {
            const separator = targetUrl.includes('?') ? '&' : '?';
            fetchUrl = `${targetUrl}${separator}t=${new Date().getTime()}`;
            options.cache = 'reload';
         }
         
         console.log(`Intentando cargar URL: ${fetchUrl}`);
         const response = await fetch(fetchUrl, options);
         
         if (!response.ok) throw new Error(`Status ${response.status}`);
         text = await response.text();

      } catch (directError: any) {
         console.warn(`Fallo carga directa: ${directError.message}. Intentando Proxy...`);
         // Fallback simple para GitHub si falla directo
         try {
             const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
             const response = await fetch(proxyUrl);
             if (!response.ok) throw new Error(`Proxy Status: ${response.status}`);
             text = await response.text();
         } catch (proxyError) {
             console.error("Fallo definitivo de carga.");
             throw new Error("No se pudo cargar el archivo desde GitHub. Verifica el enlace.");
         }
      }

      const parsedData = await parseCSV(text);
      
      if (parsedData.length === 0) {
        console.warn("CSV cargado pero vacío.");
      } else {
        console.log(`Cargados ${parsedData.length} registros.`);
      }
      
      setData(processData(parsedData));

      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (apiUrl) {
          checkIntervalRef.current = setInterval(() => {
              checkGitHubUpdate(targetUrl);
          }, UPDATE_CHECK_INTERVAL);
      }

    } catch (error) {
      console.error("Error loading remote CSV:", error);
      alert("Error cargando datos: " + (error as any).message);
      setData([]);
    } finally {
      setIsLoading(false);
      setLastCheckTime(new Date());
    }
  };

  const resetData = () => {
      setData([]);
      setIsUpdateAvailable(false);
  };

  const setCustomUrl = (url: string) => {
      if (url) {
        localStorage.setItem(STORAGE_URL_KEY, url);
        loadDataFromUrl(url, true);
      } else {
        localStorage.removeItem(STORAGE_URL_KEY);
        loadDataFromUrl(DEFAULT_CLOUD_URL, true); // Recargar default (GitHub)
      }
  };

  const getCustomUrl = () => {
      return localStorage.getItem(STORAGE_URL_KEY) || DEFAULT_CLOUD_URL;
  };

  const refreshData = () => {
      const url = getCustomUrl();
      if (url) loadDataFromUrl(url, true);
  };

  useEffect(() => {
    // Carga inicial
    const savedUrl = localStorage.getItem(STORAGE_URL_KEY);
    const urlToLoad = savedUrl || DEFAULT_CLOUD_URL;
    
    // Si no hay datos, intentar cargar
    if (data.length === 0) {
        loadDataFromUrl(urlToLoad, false);
    }
    return () => {
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uniqueStores = useMemo(() => Array.from(new Set(data.map(d => d['DESCRIPCION LOCAL2']).filter(Boolean))).sort(), [data]);
  const uniqueBrands = useMemo(() => Array.from(new Set(data.map(d => d.MARCA).filter(Boolean))).sort(), [data]);
  const uniqueFormats = useMemo(() => Array.from(new Set(data.map(d => d.FORMATO).filter(Boolean))).sort(), [data]);

  return (
    <DataContext.Provider value={{ 
        data, 
        isLoading, 
        isUpdateAvailable, 
        currentSha,
        lastCheckTime,
        loadData, 
        loadDataFromUrl, 
        resetData, 
        setCustomUrl, 
        getCustomUrl, 
        refreshData, 
        checkForUpdates, 
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