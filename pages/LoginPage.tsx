import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/inventory');
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Bienvenido</h1>
            <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400"/>
                </span>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:ring-slate-500 focus:border-slate-500 uppercase"
                    placeholder="ADMINISTRADOR"
                    required
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400"/>
                </span>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:ring-slate-500 focus:border-slate-500"
                    placeholder="••••••"
                    required
                />
            </div>
          </div>

          {error && <div className="text-red-500 text-xs text-center">{error}</div>}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 transition-colors font-medium text-sm"
          >
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
};