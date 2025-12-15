import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { ProductRow } from '../types';
import { parseCSV } from '../utils/csvParser';

// ------------------------------------------------------------------
// CONFIGURACIÓN POR DEFECTO
// ------------------------------------------------------------------
const DEFAULT_CLOUD_URL = "https://raw.githubusercontent.com/angel3189-LangeL/INVENTARIOS/main/INVENTARIO.csv";
const STORAGE_URL_KEY = 'app_inventory_csv_url';
// Intervalo de chequeo de actualizaciones (1 minuto = 60,000 ms) PARA PRUEBAS
const UPDATE_CHECK_INTERVAL = 60000; 
// ------------------------------------------------------------------

interface DataContextType {
  data: ProductRow[];
  isLoading: boolean;
  isUpdateAvailable: boolean;
  loadData: (file: File) => Promise<void>;
  loadDataFromUrl: (url: string) => Promise<void>;
  resetData: () => void;
  setCustomUrl: (url: string) => void;
  getCustomUrl: () => string;
  refreshData: () => void;
  checkForUpdates: () => Promise<void>; // Nueva función manual
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
  const checkIntervalRef = useRef<any>(null);

  // Helper to filter global exclusions (CD and CP)
  const processData = (rawData: ProductRow[]) => {
     return rawData.filter(d => d.FORMATO !== 'CD' && d.FORMATO !== 'CP');
  };

  // Helper para convertir URL Raw -> URL API de GitHub para obtener metadatos (SHA)
  const getGitHubApiUrl = (rawUrl: string) => {
    // Regex para capturar owner, repo, branch, path
    // raw.githubusercontent.com/USER/REPO/BRANCH/PATH...
    const match = rawUrl.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
    if (!match) return null;
    const [_, owner, repo, branch, path] = match;
    // URL API: https://api.github.com/repos/USER/REPO/contents/PATH?ref=BRANCH
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  };

  const checkGitHubUpdate = async (url: string) => {
    const apiUrl = getGitHubApiUrl(url);
    if (!apiUrl) return;

    console.log("Verificando actualizaciones en GitHub...");
    try {
      const response = await fetch(apiUrl, { cache: 'no-cache' });
      if (response.ok) {
        const json = await response.json();
        // Si tenemos un SHA actual y es diferente al que viene de la API, hay update
        if (currentSha && json.sha && json.sha !== currentSha) {
            console.log("Nueva versión detectada en GitHub. SHA Antiguo:", currentSha, "SHA Nuevo:", json.sha);
            setIsUpdateAvailable(true);
        } else {
            console.log("No hay actualizaciones. SHA actual:", currentSha);
        }
      }
    } catch (error) {
      console.warn("No se pudo verificar actualizaciones en GitHub:", error);
    }
  };

  const checkForUpdates = async () => {
      const url = getCustomUrl();
      await checkGitHubUpdate(url);
  };

  const loadData = async (file: File) => {
    setIsLoading(true);
    // Al cargar archivo manual, desactivamos chequeos automáticos
    setIsUpdateAvailable(false);
    setCurrentSha('');
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

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
    setIsUpdateAvailable(false); // Reset flag al cargar
    
    // 1. Clean URL Logic
    let targetUrl = url.trim();
    if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
      targetUrl = targetUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    if (targetUrl.includes('raw.githubusercontent.com') && targetUrl.includes('/refs/heads/')) {
        targetUrl = targetUrl.replace('/refs/heads/', '/');
    }

    try {
      let text = '';
      let usedProxy = false;

      // Intentar obtener el SHA actual antes de cargar (si es GitHub)
      const apiUrl = getGitHubApiUrl(targetUrl);
      if (apiUrl) {
         fetch(apiUrl).then(r => r.json()).then(d => {
             if(d.sha) {
                 console.log("SHA inicial establecido:", d.sha);
                 setCurrentSha(d.sha);
             }
         }).catch(e => console.warn("No se pudo obtener SHA inicial", e));
      }

      try {
         // 2. Attempt Direct Fetch with Cache Busting
         // Agregamos timestamp para evitar caché agresivo de GitHub Raw al actualizar
         const cacheBuster = `?t=${new Date().getTime()}`;
         const fetchUrl = targetUrl.includes('?') ? `${targetUrl}&t=${new Date().getTime()}` : `${targetUrl}${cacheBuster}`;
         
         const response = await fetch(fetchUrl, { cache: 'reload' });
         if (!response.ok) throw new Error(`Direct Status ${response.status}`);
         text = await response.text();
      } catch (directError) {
         console.warn(`Carga directa fallida para ${targetUrl}. Intentando vía Proxy...`, directError);
         usedProxy = true;
         // 3. Attempt via CORS Proxy
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

      // 6. Setup Interval for updates
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (apiUrl) {
          checkIntervalRef.current = setInterval(() => {
              checkGitHubUpdate(targetUrl);
          }, UPDATE_CHECK_INTERVAL);
      }

    } catch (error) {
      console.error("Error cargando CSV remoto:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => {
      setData([]);
      setIsUpdateAvailable(false);
  };

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

  const refreshData = () => {
      const url = getCustomUrl();
      loadDataFromUrl(url);
  };

  // Auto-load data on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_URL_KEY);
    const targetUrl = savedUrl || DEFAULT_CLOUD_URL;
    
    if (targetUrl && data.length === 0) {
        loadDataFromUrl(targetUrl);
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