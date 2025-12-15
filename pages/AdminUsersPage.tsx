import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserPlus, Shield, Database, Save, RefreshCw, AlertTriangle, Github } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { getUsers, createUser } = useAuth();
  const { setCustomUrl, getCustomUrl, isLoading } = useData();
  
  // User Management State
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<'ADMINISTRADOR' | 'VISUALIZADOR'>('VISUALIZADOR');
  const [msg, setMsg] = useState('');

  // Data Connection State
  const [cloudUrl, setCloudUrl] = useState('');
  const [urlMsg, setUrlMsg] = useState('');

  const users = getUsers();

  useEffect(() => {
    setCloudUrl(getCustomUrl());
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (createUser(newUser.toUpperCase(), newPass, newRole)) {
      setMsg('Usuario creado exitosamente');
      setNewUser('');
      setNewPass('');
    } else {
      setMsg('Error: El usuario ya existe');
    }
  };

  const handleSaveUrl = () => {
    setCustomUrl(cloudUrl);
    setUrlMsg('URL actualizada. La aplicación intentará cargar estos datos.');
    setTimeout(() => setUrlMsg(''), 3000);
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
                Conexión de Datos (GitHub)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Configura aquí la URL permanente de tu archivo <code>INVENTARIO.csv</code> alojado en <strong>GitHub (Raw)</strong>. 
                Esto permitirá que todos los usuarios vean los mismos datos al iniciar sesión.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
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
            {urlMsg && <p className="text-xs text-green-600 mt-2 font-medium">{urlMsg}</p>}
            
            <div className="mt-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-700 flex items-start">
                <Github className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5"/>
                <div>
                    <strong>Recomendación:</strong> Usa siempre el enlace "Raw" de GitHub. Si actualizas el archivo en GitHub (manteniendo el mismo nombre), 
                    los cambios se reflejarán automáticamente aquí después de unos minutos (por el caché de GitHub).
                </div>
            </div>
         </div>

         {/* Create User Form */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-700">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreate} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Usuario</label>
                    <input 
                        type="text" 
                        value={newUser} 
                        onChange={e => setNewUser(e.target.value.toUpperCase())} 
                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white text-gray-900 focus:ring-slate-500 focus:border-slate-500" 
                        required 
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
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Rol</label>
                    <select 
                        value={newRole} 
                        onChange={e => setNewRole(e.target.value as any)} 
                        className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-white text-gray-900 focus:ring-slate-500 focus:border-slate-500"
                    >
                        <option value="VISUALIZADOR">VISUALIZADOR</option>
                        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                </div>
                <button type="submit" className="w-full flex items-center justify-center bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm transition-colors">
                    <UserPlus className="w-4 h-4 mr-2" /> Crear Usuario
                </button>
                {msg && <p className="text-xs text-center text-blue-600 mt-2">{msg}</p>}
            </form>
         </div>

         {/* List Users */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-700">Usuarios Existentes (Locales)</h3>
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
         </div>
      </div>
    </div>
  );
};