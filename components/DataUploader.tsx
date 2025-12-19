import React, { useRef, useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Github, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

export const DataUploader: React.FC = () => {
  const { loadData, loadDataFromUrl, isLoading, data, setCustomUrl, getCustomUrl } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  
  // Load current URL if exists
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await loadData(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 text-center border border-gray-100">
            
          <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
            </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cargar Inventario</h2>
          <p className="text-gray-500 mb-8 text-sm">
            Selecciona el origen de tus datos.
          </p>

          <div className="space-y-6">
             
             {/* URL UPLOAD */}
             <form onSubmit={handleUrlSubmit} className="space-y-3">
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Github className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="url"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-xs border-gray-300 rounded-md py-2 border bg-gray-50 text-gray-600"
                        placeholder="https://raw.githubusercontent.com/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !url}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-all"
                >
                    {isLoading ? (
                        <span className="flex items-center">
                            <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Cargando...
                        </span>
                    ) : (
                        <>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Cargar desde URL
                        </>
                    )}
                </button>
            </form>

             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="px-2 bg-white text-gray-400">O cargar archivo local</span>
                </div>
            </div>

            {/* MANUAL UPLOAD */}
             <div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all"
                >
                    <Upload className="h-4 w-4 mr-2 text-gray-500" />
                    Seleccionar CSV Local
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,.txt"
                    className="hidden"
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};