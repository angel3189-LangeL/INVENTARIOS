import React, { useRef, useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Github, RefreshCw, Radio } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

export const DataUploader: React.FC = () => {
  const { loadData, loadDataFromUrl, isLoading, data, setCustomUrl, getCustomUrl, checkForUpdates } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Load current URL
  useEffect(() => {
    const current = getCustomUrl();
    if (current) setUrl(current);
  }, []);

  // Redirect if data loads
  useEffect(() => {
    if (data.length > 0) {
        navigate('/inventory');
    }
  }, [data, navigate]);

  const processUrl = (inputUrl: string) => {
    let finalUrl = inputUrl.trim();
    if (finalUrl.includes('github.com') && finalUrl.includes('/blob/')) {
      finalUrl = finalUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    if (finalUrl.includes('raw.githubusercontent.com') && finalUrl.includes('/refs/heads/')) {
        finalUrl = finalUrl.replace('/refs/heads/', '/');
    }
    return finalUrl;
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const fixedUrl = processUrl(url);
    if (fixedUrl !== url) setUrl(fixedUrl);
    setCustomUrl(fixedUrl);
  };

  const handleManualCheck = async () => {
      setIsChecking(true);
      await checkForUpdates();
      // Delay slightly to show interaction
      setTimeout(() => setIsChecking(false), 800);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await loadData(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 text-center border border-gray-100">
            <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg">
                    <Github className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
            </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Sincronización con GitHub</h2>
          <p className="text-gray-500 mb-6 sm:mb-8 text-sm">
            El sistema está configurado para leer automáticamente desde el REPOSITORIO.
          </p>

          <div className="space-y-6">
             <form onSubmit={handleUrlSubmit} className="space-y-3">
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="url"
                        className="focus:ring-slate-500 focus:border-slate-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border bg-gray-50 text-gray-500"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isLoading}
                        readOnly={true} // Read-only for dashboard view
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-all"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                            <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            Conectando...
                            </span>
                        ) : (
                            <>
                                <Github className="mr-2 h-5 w-5" />
                                Recargar Datos
                            </>
                        )}
                    </button>
                     <button
                        type="button"
                        onClick={handleManualCheck}
                        disabled={isLoading || isChecking}
                        className="flex-shrink-0 flex justify-center items-center py-3 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-all"
                        title="Verificar si hay cambios en GitHub ahora"
                    >
                         <Radio className={`h-5 w-5 ${isChecking ? 'animate-pulse text-blue-600' : 'text-slate-500'}`} />
                    </button>
                </div>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Uso Avanzado</span>
                </div>
            </div>

            <div>
                <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-colors"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Subir archivo local (Temporal)
                </button>
                <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.txt"
                className="hidden"
                />
            </div>
            
             <div className="mt-4 text-xs text-gray-400">
                Para actualizar permanentemente, sube un nuevo <code>INVENTARIO.csv</code> al REPOSITORIO.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};