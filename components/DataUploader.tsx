import React, { useRef, useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Link as LinkIcon, DownloadCloud, Github } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const DataUploader: React.FC = () => {
  const { loadData, loadDataFromUrl, isLoading, data } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [searchParams] = useSearchParams();

  // Auto-convert GitHub blob links to raw links
  const processUrl = (inputUrl: string) => {
    let finalUrl = inputUrl.trim();
    if (finalUrl.includes('github.com') && finalUrl.includes('/blob/')) {
      finalUrl = finalUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return finalUrl;
  };

  // 1. Auto-load from query param (e.g. ?csv=https://...)
  useEffect(() => {
    const csvParam = searchParams.get('csv');
    if (csvParam && data.length === 0 && !isLoading) {
        const fixedUrl = processUrl(csvParam);
        setUrl(fixedUrl);
        loadDataFromUrl(fixedUrl);
    }
  }, [searchParams, data.length, isLoading, loadDataFromUrl]);

  // 2. Redirect if data is successfully loaded
  useEffect(() => {
    if (data.length > 0) {
        navigate('/inventory');
    }
  }, [data, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await loadData(file);
      // Navigation handled by useEffect
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    const fixedUrl = processUrl(url);
    if (fixedUrl !== url) {
        console.log("Converted GitHub URL to Raw:", fixedUrl);
        setUrl(fixedUrl);
    }
    
    await loadDataFromUrl(fixedUrl);
    // Navigation handled by useEffect
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Cargar Datos</h2>
          <p className="text-gray-500 mb-6 sm:mb-8 text-sm">
            Recomendado: Usa un archivo alojado en <strong>GitHub</strong>.
          </p>

          <div className="space-y-6">
            
             {/* Option 2: URL Upload (Primary for GitHub) */}
             <form onSubmit={handleUrlSubmit} className="space-y-3">
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="url"
                        className="focus:ring-slate-500 focus:border-slate-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                        placeholder="Link GitHub o URL CSV..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !url}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-all"
                >
                    {isLoading ? (
                         <span className="flex items-center">
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Descargando...
                         </span>
                    ) : (
                        <>
                            <DownloadCloud className="mr-2 h-5 w-5" />
                            Cargar desde URL
                        </>
                    )}
                </button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">o subir archivo local</span>
                </div>
            </div>

            {/* Option 1: File Upload */}
            <div>
                <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-colors"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar archivo .csv
                </button>
                <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.txt"
                className="hidden"
                />
            </div>
            
            <div className="mt-6 text-xs text-left bg-slate-50 p-3 sm:p-4 rounded-md border border-slate-200 text-slate-700">
                <p className="font-bold mb-1 flex items-center"><Github className="w-3 h-3 mr-1"/> Tip para GitHub:</p>
                <p className="opacity-90">
                    Pega el enlace normal (ej. <code>github.com/.../blob/...</code>) y lo convertiremos automáticamente.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};