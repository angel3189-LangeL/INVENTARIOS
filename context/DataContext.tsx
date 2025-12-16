import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { ProductRow } from '../types';
import { parseCSV } from '../utils/csvParser';

// ------------------------------------------------------------------
// CONFIGURACIÓN POR DEFECTO (GITHUB)
// ------------------------------------------------------------------
const DEFAULT_CLOUD_URL = "https://raw.githubusercontent.com/angel3189-LangeL/datos-inventario/refs/heads/main/data/csv/INVENTARIO.csv";
const STORAGE_URL_KEY = 'app_inventory_csv_url';
// Intervalo de chequeo de actualizaciones (5 minutos = 300,000 ms)
const UPDATE_CHECK_INTERVAL = 300000; 
// ------------------------------------------------------------------

interface DataContextType {
  data: ProductRow[];
  isLoading: boolean;
  isUpdateAvailable: boolean;
  currentSha: string; // Exponemos el SHA actual
  lastCheckTime: Date | null; // Nueva propiedad para saber cuándo revisó por última vez
  loadData: (file: File) => Promise<void>;
  loadDataFromUrl: (url: string, forceRefresh?: boolean) => Promise<void>;
  resetData: () => void;
  setCustomUrl: (url: string) => void;
  getCustomUrl: () => string;
  refreshData: () => void;
  checkForUpdates: () => Promise<boolean>; // Devuelve true si encontró update
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

  // Helper to filter global exclusions (CD and CP)
  const processData = (rawData: ProductRow[]) => {
     return rawData.filter(d => d.FORMATO !== 'CD' && d.FORMATO !== 'CP');
  };

  // Helper para convertir URL Raw -> URL API de GitHub para obtener metadatos (SHA)
  const getGitHubApiUrl = (rawUrl: string) => {
    // Regex para capturar owner, repo, branch, path
    // raw.githubusercontent.com/USER/REPO/BRANCH/PATH...
    // Soporta raw.githubusercontent.com/USER/REPO/main/FILE o refs/heads/main/FILE
    
    // Limpieza preventiva de la URL para la API
    let cleanUrl = rawUrl;
    if (cleanUrl.includes('/refs/heads/')) {
        cleanUrl = cleanUrl.replace('/refs/heads/', '/');
    }

    const match = cleanUrl.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
    if (!match) return null;
    const [_, owner, repo, branch, path] = match;
    // URL API: https://api.github.com/repos/USER/REPO/contents/PATH?ref=BRANCH
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  };

  const checkGitHubUpdate = async (url: string): Promise<boolean> => {
    setLastCheckTime(new Date()); // Actualizamos la hora de verificación
    const apiUrl = getGitHubApiUrl(url);
    if (!apiUrl) {
        // No es GitHub, no podemos chequear SHA via API
        return false;
    }

    console.log("Verificando actualizaciones en GitHub...");
    try {
      const response = await fetch(apiUrl, { cache: 'no-cache' });
      if (response.ok) {
        const json = await response.json();
        // Si tenemos un SHA actual y es diferente al que viene de la API, hay update
        if (currentSha && json.sha && json.sha !== currentSha) {
            console.log("Nueva versión detectada en GitHub. SHA Antiguo:", currentSha, "SHA Nuevo:", json.sha);
            setIsUpdateAvailable(true);
            return true;
        } else {
            console.log("No hay actualizaciones. SHA actual coincide:", currentSha);
            return false;
        }
      }
      return false;
    } catch (error) {
      console.warn("No se pudo verificar actualizaciones en GitHub:", error);
      return false;
    }
  };

  const checkForUpdates = async () => {
      const url = getCustomUrl();
      return await checkGitHubUpdate(url);
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

  const loadDataFromUrl = async (url: string, forceRefresh: boolean = false) => {
    if (!url) return;
    setIsLoading(true);
    setIsUpdateAvailable(false); // Reset flag al cargar
    
    // 1. Clean URL Logic
    let targetUrl = url.trim();
    
    // Fix GitHub Raw Links
    if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
      targetUrl = targetUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    // Remove refs/heads/ which breaks raw links sometimes
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
      } else {
          setCurrentSha(''); // Reset sha si no es github
      }

      try {
         // ESTRATEGIA DE CARGA: Directa -> Proxy 1 (corsproxy.io) -> Proxy 2 (allorigins)
         
         // INTENTO 1: Fetch Directo
         let fetchUrl = targetUrl;
         const options: RequestInit = {};

         if (forceRefresh) {
            const separator = targetUrl.includes('?') ? '&' : '?';
            fetchUrl = `${targetUrl}${separator}t=${new Date().getTime()}`;
            options.cache = 'reload';
            console.log("Forzando descarga fresca de:", fetchUrl);
         } else {
            console.log("Cargando (usando caché de navegador si es posible):", fetchUrl);
         }
         
         const response = await fetch(fetchUrl, options);
         if (!response.ok) throw new Error(`Direct Status ${response.status}`);
         text = await response.text();

      } catch (directError) {
         console.warn(`Carga directa fallida para ${targetUrl}. Intentando Proxies...`, directError);
         usedProxy = true;
         
         try {
             // INTENTO 2: corsproxy.io
             const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
             console.log("Intentando corsproxy.io...");
             const response = await fetch(proxyUrl);
             if (!response.ok) throw new Error(`Proxy 1 Status: ${response.status}`);
             text = await response.text();
         } catch (proxy1Error) {
             console.warn(`Proxy 1 falló. Intentando Proxy 2...`, proxy1Error);
             
             // INTENTO 3: allorigins.win
             const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}&disableCache=${Date.now()}`;
             console.log("Intentando allorigins...");
             const response = await fetch(proxyUrl);
             if (!response.ok) throw new Error(`Proxy 2 Status: ${response.status}`);
             text = await response.text();
         }
      }

      // 5. Parse
      const parsedData = await parseCSV(text);
      
      if (parsedData.length === 0) {
        console.warn("El CSV cargado está vacío.");
      } else {
        console.log(`Datos cargados exitosamente (${parsedData.length} filas). Proxy usado: ${usedProxy}`);
      }
      
      setData(processData(parsedData));

      // 6. Setup Interval for updates (Only works reliably for GitHub)
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (apiUrl) {
          checkIntervalRef.current = setInterval(() => {
              const now = new Date();
              const hour = now.getHours();
              const day = now.getDay(); 

              const isWeekDay = day >= 1 && day <= 5; 
              const isWorkHour = hour >= 8 && hour < 12;

              if (isWeekDay && isWorkHour) {
                  checkGitHubUpdate(targetUrl);
              } else {
                  console.log(`Sincronización pausada. Hora: ${now.toLocaleTimeString()}, Día: ${day}. Regla: L-V 08:00-12:00.`);
              }
          }, UPDATE_CHECK_INTERVAL);
      }

    } catch (error) {
      console.error("Error cargando CSV remoto:", error);
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
        loadDataFromUrl(DEFAULT_CLOUD_URL, true);
      }
  };

  const getCustomUrl = () => {
      return localStorage.getItem(STORAGE_URL_KEY) || DEFAULT_CLOUD_URL;
  };

  const refreshData = () => {
      const url = getCustomUrl();
      loadDataFromUrl(url, true);
  };

  // Auto-load data on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_URL_KEY);
    const targetUrl = savedUrl || DEFAULT_CLOUD_URL;
    
    if (targetUrl && data.length === 0) {
        loadDataFromUrl(targetUrl, false);
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