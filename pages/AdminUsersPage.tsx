import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { getUsers, createUser } = useAuth();
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<'ADMINISTRADOR' | 'VISUALIZADOR'>('VISUALIZADOR');
  const [msg, setMsg] = useState('');

  const users = getUsers();

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 text-slate-700 mr-2" />
            Gestión de Usuarios
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Form */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-700">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreate} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700">Usuario</label>
                    <input type="text" value={newUser} onChange={e => setNewUser(e.target.value.toUpperCase())} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Contraseña</label>
                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700">Rol</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm">
                        <option value="VISUALIZADOR">VISUALIZADOR</option>
                        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                </div>
                <button type="submit" className="w-full flex items-center justify-center bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm">
                    <UserPlus className="w-4 h-4 mr-2" /> Crear Usuario
                </button>
                {msg && <p className="text-xs text-center text-blue-600 mt-2">{msg}</p>}
            </form>
         </div>

         {/* List */}
         <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-base font-semibold mb-4 text-gray-700">Usuarios Existentes</h3>
            <ul className="divide-y divide-gray-100">
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