import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Users, Loader, RefreshCw, AlertCircle, Menu, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { DataUploader } from './DataUploader';

export const Layout: React.FC = () => {
  const { data, isLoading, isUpdateAvailable, refreshData, resetData } = useData();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    resetData(); // Limpiamos los datos de memoria
    logout();
    navigate('/');
  };

  // If loading data
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-center">
                <Loader className="h-8 w-8 animate-spin text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400">Cargando datos...</p>
            </div>
        </div>
    );
  }

  // If no data and not loading (URL failed or empty)
  if (data.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black">
             <div className="w-full max-w-4xl p-4">
                <div className="mb-4 text-center">
                     <p className="text-red-400 font-medium bg-red-900/20 p-3 rounded border border-red-800 inline-block">
                        No se cargaron datos automáticos. Por favor carga un archivo manual.
                     </p>
                     <button onClick={handleLogout} className="ml-4 text-sm underline text-slate-400 hover:text-slate-200">Salir</button>
                </div>
                <DataUploader />
             </div>
        </div>
      );
  }

  const navItems = [
    { path: '/inventory', label: 'INVENTARIOS' },
    { path: '/top-negative', label: 'TOP NEGATIVOS' },
    { path: '/top-overstock', label: 'TOP SOBRE STOCK' },
    { path: '/ranking', label: 'RANKING' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Update Notification Banner */}
      {isUpdateAvailable && (
        <div className="bg-blue-600 text-white px-4 py-2 shadow-md relative z-50">
           <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center text-xs sm:text-sm font-medium">
                    <AlertCircle className="w-4 h-4 mr-2 animate-pulse" />
                    <span>Nueva versión disponible en SERVIDOR.</span>
                </div>
                <button 
                    onClick={() => refreshData()}
                    className="bg-white text-blue-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide hover:bg-blue-50 transition-colors flex items-center shadow-sm"
                >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Actualizar
                </button>
           </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row items-center justify-between h-14 sm:h-16">
            
            {/* Left Side: Menu Button & Brand */}
            <div className="flex items-center gap-3">
               {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="sm:hidden p-1 text-slate-300 hover:text-white focus:outline-none bg-slate-800 rounded border border-slate-700"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-2">
                 <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-9 w-auto object-contain bg-white rounded-md p-0.5" 
                    onError={(e) => e.currentTarget.style.display = 'none'} 
                 />
                 <span className="font-bold text-lg sm:text-xl tracking-wider truncate hidden xs:block">DASHBOARD</span>
              </div>
            </div>
            
            {/* Desktop Navigation (Hidden on Mobile) */}
            <nav className="hidden sm:flex space-x-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                            ? 'bg-slate-700 text-white shadow-inner border border-slate-600'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        {item.label}
                    </NavLink>
                    );
                })}
            </nav>

            {/* Right Side: Admin/Logout */}
            <div className="flex items-center space-x-2">
                 {/* Mobile Admin/Logout */}
                 <div className="flex sm:hidden">
                    {user?.role === 'ADMINISTRADOR' && (
                        <button onClick={() => navigate('/admin-users')} className="p-2 text-slate-400 hover:text-white">
                            <Users className="w-5 h-5"/>
                        </button>
                    )}
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white">
                        <LogOut className="w-5 h-5" />
                    </button>
                 </div>

                 {/* Desktop Admin/Logout */}
                 <div className="hidden sm:flex items-center space-x-2">
                    {user?.role === 'ADMINISTRADOR' && (
                        <button 
                            onClick={() => navigate('/admin-users')}
                            className={`p-2 rounded-full flex-shrink-0 transition-colors ${location.pathname === '/admin-users' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            title="Gestionar Usuarios"
                        >
                            <Users className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full flex-shrink-0"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                 </div>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="sm:hidden bg-slate-800 border-t border-slate-700 absolute w-full shadow-xl">
             <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setIsMenuOpen(false);
                            }}
                            className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium ${
                                isActive 
                                ? 'bg-slate-900 text-white border-l-4 border-blue-500' 
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
             </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-1 sm:px-6 lg:px-8 py-2 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
};