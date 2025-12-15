import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserPlus, Shield, Database, Save, RefreshCw, Github, Search, Wifi, Download, Upload, FileText } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { getUsers, createUser, importUsers } = useAuth();
  const { setCustomUrl, getCustomUrl, isLoading, checkForUpdates, currentSha, isUpdateAvailable, lastCheckTime } = useData();
  
  // User Management State
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<'ADMINISTRADOR' | 'VISUALIZADOR'>('VISUALIZADOR');
  const [msg, setMsg] = useState('');
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data Connection State
  const [cloudUrl, setCloudUrl] = useState('');
  const [urlMsg, setUrlMsg] = useState('');

  // Check update status state
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string>('');
  
  // Forcing re-render of user list after import
  const [userListTick, setUserListTick] = useState(0);

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
      setUserListTick(prev => prev + 1);
    } else {
      setMsg('Error: El usuario ya existe');
    }
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

  // --- Export / Import Logic ---

  const handleExportUsers = () => {
      const csvHeader = "usuario;password;rol\n";
      const csvRows = users.map(u => `${u.username};${u.pass};${u.role}`).join("\n");
      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "usuarios_sistema.csv";
      link.click();
  };

  const handleImportClick = () => {
      if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const content = evt.target?.result as string;
          if (content) {
              const lines = content.split(/\r?\n/);
              const newUsers = [];
              // Start from 1 to skip header if present, or detect header
              for (let line of lines) {
                  line = line.trim();
                  if (!line) continue;
                  
                  // Detect delimiter
                  const delimiter = line.includes(';') ? ';' : ',';
                  const parts = line.split(delimiter);
                  
                  if (parts.length >= 3) {
                      const username = parts[0].trim().toUpperCase();
                      const pass = parts[1].trim();
                      const role = parts[2].trim().toUpperCase();

                      // Skip header row usually containing "usuario" or "username"
                      if (username.includes('USUARIO') || username.includes('USERNAME')) continue;

                      if (username && pass && (role === 'ADMINISTRADOR' || role === 'VISUALIZADOR')) {
                          newUsers.push({ username, pass, role });
                      }
                  }
              }

              if (newUsers.length > 0) {
                  if (window.confirm(`Se han encontrado ${newUsers.length} usuarios válidos. ¿Deseas reemplazar la lista actual?`)) {
                      importUsers(newUsers);
                      setMsg(`Se importaron ${newUsers.length} usuarios.`);
                      setUserListTick(prev => prev + 1);
                  }
              } else {
                  alert("No se encontraron usuarios válidos en el archivo. Asegúrate que el formato sea: usuario;password;rol");
              }
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
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
                Conexión de Datos (SERVIDOR)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Configura aquí la URL permanente de tu archivo <code>INVENTARIO.csv</code> alojado en <strong>el SERVIDOR (Raw)</strong>. 
                Esto permitirá que todos los usuarios vean los mismos datos al iniciar sesión.
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
                        Sincronización Inteligente (Ahorro de Datos)
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
                        <p className="text-slate-400 italic">El sistema verifica cambios automáticamente cada 5 min <strong>(Lun-Vie, 08:00 - 12:00)</strong>.</p>
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
                         {isUpdateAvailable && !checkResult && (
                            <span className="text-xs mt-1 font-bold text-blue-600 animate-pulse">
                                ¡Actualización disponible!
                            </span>
                        )}
                    </div>
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
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-700">Usuarios Locales</h3>
                <div className="flex space-x-2">
                    <button 
                        onClick={handleExportUsers}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                        title="Descargar lista de usuarios (CSV)"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleImportClick}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Cargar lista de usuarios (CSV)"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    {/* Hidden input for import */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".csv,.txt"
                        className="hidden" 
                    />
                </div>
            </div>
            
            <ul className="divide-y divide-gray-100 overflow-y-auto scrollbar-thin flex-1 max-h-[300px]">
                {users.map((u, i) => (
                    <li key={i} className="py-2 flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-800">{u.username}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {u.role}
                        </span>
                    </li>
                ))}
            </ul>
             <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded text-xs text-gray-500">
                <div className="flex items-start">
                    <FileText className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                    <p>
                        Para importar masivamente, usa un archivo CSV con el formato: <br/>
                        <code className="bg-white border px-1 rounded">USUARIO;PASSWORD;ROL</code>
                    </p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};