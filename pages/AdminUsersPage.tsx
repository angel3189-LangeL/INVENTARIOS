import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Shield, Github, Search, Wifi, Loader, FileJson, Download } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { getUsers, createUser, usersUrl } = useAuth();
  const { checkForUpdates, currentSha, lastCheckTime, getCustomUrl } = useData();
  
  // User Management State
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<'ADMINISTRADOR' | 'VISUALIZADOR'>('VISUALIZADOR');
  const [msg, setMsg] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Check update status state
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string>('');

  const users = getUsers();
  const currentCsvUrl = getCustomUrl();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setMsg('');
    
    // Simulate async slightly for UX
    await new Promise(r => setTimeout(r, 500));

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

  const handleCheckUpdates = async () => {
      setIsChecking(true);
      setCheckResult('');
      const hasUpdate = await checkForUpdates();
      setIsChecking(false);
      
      if (hasUpdate) {
          setCheckResult('¡Nueva versión encontrada! Revisa la barra superior.');
      } else {
          setCheckResult('El archivo está actualizado (No hay cambios en GitHub).');
      }
      
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
         
         {/* GitHub Status / Info Section */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200 lg:col-span-2">
            <h3 className="text-base font-bold mb-4 text-gray-800 flex items-center border-b pb-2">
                <Github className="w-5 h-5 mr-2 text-slate-700"/>
                Estado de Sincronización (GitHub)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fuentes de Datos (Automáticas)</h4>
                     <ul className="text-sm space-y-3">
                         <li className="flex flex-col">
                             <span className="font-medium text-gray-700">Inventario (CSV)</span>
                             <a href={currentCsvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate text-xs font-mono bg-blue-50 p-1 rounded mt-1">
                                 {currentCsvUrl}
                             </a>
                         </li>
                         <li className="flex flex-col">
                             <span className="font-medium text-gray-700">Usuarios (JSON)</span>
                             <a href={usersUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate text-xs font-mono bg-blue-50 p-1 rounded mt-1">
                                 {usersUrl}
                             </a>
                         </li>
                     </ul>
                </div>

                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                     <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-700">Versión Actual</span>
                             <span className="flex items-center text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                                <Wifi className="w-3 h-3 mr-1" />
                                Conectado
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                            <strong>SHA:</strong> <span className="font-mono bg-white px-1 border rounded">{currentSha ? currentSha.substring(0, 8) : 'Desconocido'}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                            <strong>Última verificación:</strong> {lastCheckTime ? lastCheckTime.toLocaleTimeString() : 'Recién cargado'}
                        </p>
                     </div>
                     
                     <div className="mt-4 flex flex-col items-end">
                        <button 
                            onClick={handleCheckUpdates}
                            disabled={isChecking}
                            className={`w-full sm:w-auto flex items-center justify-center text-xs px-3 py-2 rounded border transition-colors ${isChecking ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'}`}
                        >
                            {isChecking ? <Loader className="w-3 h-3 animate-spin mr-2"/> : <Search className="w-3 h-3 mr-2"/>}
                            {isChecking ? 'Verificando...' : 'Buscar actualizaciones'}
                        </button>
                        {checkResult && (
                            <span className={`text-xs mt-2 font-medium text-center sm:text-right w-full block ${checkResult.includes('encontrada') ? 'text-green-600' : 'text-slate-500'}`}>
                                {checkResult}
                            </span>
                        )}
                    </div>
                </div>
            </div>
         </div>

         {/* Create User Form */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-700 flex items-center">
                <FileJson className="w-5 h-5 mr-2 text-yellow-600" />
                Gestión de Usuarios
            </h3>
            <p className="text-xs text-gray-500 mb-4 bg-yellow-50 p-2 rounded border border-yellow-100 leading-relaxed">
                <strong>Instrucciones:</strong> Al crear un usuario aquí, se descargará un archivo <code>users.json</code>. 
                <br/><br/>
                Para aplicar los cambios a todos los usuarios, debes <strong>subir manualmente</strong> este archivo a la carpeta del repositorio en GitHub.
            </p>
            <form onSubmit={handleCreate} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Nuevo Usuario</label>
                    <input 
                        type="text" 
                        value={newUser} 
                        onChange={e => setNewUser(e.target.value.toUpperCase())} 
                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white text-gray-900 focus:ring-slate-500 focus:border-slate-500" 
                        required 
                        disabled={isCreatingUser}
                        placeholder="NOMBRE"
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
                        placeholder="••••••"
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
                    className="w-full flex items-center justify-center bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 text-sm transition-colors disabled:opacity-70 mt-4"
                >
                    {isCreatingUser ? (
                         <><Loader className="w-4 h-4 mr-2 animate-spin" /> Generando archivo...</>
                    ) : (
                         <><Download className="w-4 h-4 mr-2" /> Crear y Descargar JSON</>
                    )}
                </button>
                {msg && <p className={`text-xs text-center mt-2 ${msg.includes('Error') ? 'text-red-500' : 'text-green-600 font-semibold'}`}>{msg}</p>}
            </form>
         </div>

         {/* List Users */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-700 flex justify-between items-center">
                <span>Usuarios Actuales</span>
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">
                   Lectura desde GitHub
                </span>
            </h3>
            {users.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                    <Loader className="w-6 h-6 mx-auto mb-2 animate-spin"/>
                    Cargando lista...
                </div>
            ) : (
                <ul className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto scrollbar-thin">
                    {users.map((u, i) => (
                        <li key={i} className="py-3 flex justify-between items-center text-sm">
                            <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-xs font-bold ${u.role === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {u.username.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-800">{u.username}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${u.role === 'ADMINISTRADOR' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
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