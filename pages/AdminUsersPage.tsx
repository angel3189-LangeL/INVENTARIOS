import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserPlus, Shield, Database, Save, RefreshCw, Github, Search, Wifi, Loader } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { getUsers, createUser } = useAuth();
  const { setCustomUrl, getCustomUrl, isLoading, checkForUpdates, currentSha, isUpdateAvailable, lastCheckTime } = useData();
  
  // User Management State
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<'ADMINISTRADOR' | 'VISUALIZADOR'>('VISUALIZADOR');
  const [msg, setMsg] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Data Connection State
  const [cloudUrl, setCloudUrl] = useState('');
  const [urlMsg, setUrlMsg] = useState('');

  // Check update status state
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string>('');

  const users = getUsers();

  useEffect(() => {
    setCloudUrl(getCustomUrl());
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setMsg('');
    
    const result = await createUser(newUser.toUpperCase(), newPass, newRole);
    
    if (result.success) {
      setMsg(result.msg);
      setNewUser('');
      setNewPass('');
    } else {
      setMsg(`Error: ${result.msg}`);
    }
    setIsCreatingUser(false);
  };

  const handleSaveUrl = () => {
    setCustomUrl(cloudUrl);
    setUrlMsg('URL actualizada. La aplicación intentará cargar estos datos.');
    setTimeout(() => setUrlMsg(''), 3000);
  };

  const handleCheckUpdates = async () => {
      setIsChecking(true);
      setCheckResult('');
      const hasUpdate = await checkForUpdates();
      setIsChecking(false);
      
      if (hasUpdate) {
          setCheckResult('¡Nueva versión encontrada! Revisa la barra superior.');
      } else {
          setCheckResult('El archivo está actualizado (No hay cambios en el SERVIDOR).');
      }
      
      // Clear msg after 5s
      setTimeout(() => setCheckResult(''), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-4 rounded-lg shadow-sm border border-slate-800 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Panel de Administración
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Cloud Connection Config */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200 lg:col-span-2">
            <h3 className="text-base font-bold mb-4 text-gray-800 flex items-center border-b pb-2">
                <Database className="w-5 h-5 mr-2 text-blue-600"/>
                Conexión de Datos (Inventario)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Configura aquí la URL permanente de tu archivo <code>INVENTARIO.csv</code> alojado en <strong>el SERVIDOR (Raw)</strong>. 
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input 
                    type="url" 
                    value={cloudUrl}
                    onChange={(e) => setCloudUrl(e.target.value)}
                    placeholder="https://raw.githubusercontent.com/..."
                    className="flex-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
                <button 
                    onClick={handleSaveUrl}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 text-sm font-medium transition-colors"
                >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Configuración
                </button>
            </div>
            {urlMsg && <p className="text-xs text-green-600 mt-2 font-medium mb-4">{urlMsg}</p>}
            
            {/* Version Control Status Section */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                        <Github className="w-4 h-4 mr-2"/>
                        Sincronización Inteligente
                    </div>
                    <span className="flex items-center text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                        <Wifi className="w-3 h-3 mr-1" />
                        Activo
                    </span>
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Versión Actual (SHA):</strong> <span className="font-mono bg-white px-1 border rounded">{currentSha ? currentSha.substring(0, 8) : 'Desconocido / Local'}</span></p>
                        <p><strong>Última verificación:</strong> {lastCheckTime ? lastCheckTime.toLocaleTimeString() : 'Recién cargado'}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <button 
                            onClick={handleCheckUpdates}
                            disabled={isChecking || !currentSha}
                            className={`flex items-center text-xs px-3 py-2 rounded border transition-colors ${isChecking ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'}`}
                        >
                            {isChecking ? <RefreshCw className="w-3 h-3 animate-spin mr-2"/> : <Search className="w-3 h-3 mr-2"/>}
                            {isChecking ? 'Verificando...' : 'Buscar actualización ahora'}
                        </button>
                        {checkResult && (
                            <span className={`text-xs mt-1 font-medium ${checkResult.includes('encontrada') ? 'text-green-600' : 'text-slate-500'}`}>
                                {checkResult}
                            </span>
                        )}
                    </div>
                </div>
            </div>
         </div>

         {/* Create User Form */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-700">Crear Nuevo Usuario (Google Sheets)</h3>
            <form onSubmit={handleCreate} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Usuario</label>
                    <input 
                        type="text" 
                        value={newUser} 
                        onChange={e => setNewUser(e.target.value.toUpperCase())} 
                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white text-gray-900 focus:ring-slate-500 focus:border-slate-500" 
                        required 
                        disabled={isCreatingUser}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Contraseña</label>
                    <input 
                        type="password" 
                        value={newPass} 
                        onChange={e => setNewPass(e.target.value)} 
                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white text-gray-900 focus:ring-slate-500 focus:border-slate-500" 
                        required 
                        disabled={isCreatingUser}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Rol</label>
                    <select 
                        value={newRole} 
                        onChange={e => setNewRole(e.target.value as any)} 
                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white text-gray-900 focus:ring-slate-500 focus:border-slate-500"
                        disabled={isCreatingUser}
                    >
                        <option value="VISUALIZADOR">VISUALIZADOR</option>
                        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                </div>
                <button 
                    type="submit" 
                    disabled={isCreatingUser}
                    className="w-full flex items-center justify-center bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm transition-colors disabled:opacity-70"
                >
                    {isCreatingUser ? (
                         <><Loader className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                    ) : (
                         <><UserPlus className="w-4 h-4 mr-2" /> Crear Usuario</>
                    )}
                </button>
                {msg && <p className={`text-xs text-center mt-2 ${msg.includes('Error') ? 'text-red-500' : 'text-blue-600'}`}>{msg}</p>}
            </form>
         </div>

         {/* List Users */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-700 flex justify-between items-center">
                <span>Usuarios Existentes</span>
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">Desde API</span>
            </h3>
            {users.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                    <Loader className="w-6 h-6 mx-auto mb-2 animate-spin"/>
                    Cargando usuarios...
                </div>
            ) : (
                <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto scrollbar-thin">
                    {users.map((u, i) => (
                        <li key={i} className="py-2 flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-800">{u.username}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                {u.role}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
         </div>
      </div>
    </div>
  );
};