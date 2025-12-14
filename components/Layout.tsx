import React, { useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, Users, Loader } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { DataUploader } from './DataUploader';

export const Layout: React.FC = () => {
  const { data, isLoading } = useData();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // If loading data
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <Loader className="h-8 w-8 animate-spin text-slate-800 mx-auto mb-2" />
                <p className="text-slate-600">Cargando datos...</p>
            </div>
        </div>
    );
  }

  // If no data and not loading (URL failed or empty)
  // Render the Uploader so user can manually fix it
  if (data.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
             <div className="w-full max-w-4xl p-4">
                <div className="mb-4 text-center">
                     <p className="text-red-500 font-medium bg-red-50 p-3 rounded border border-red-200 inline-block">
                        No se cargaron datos automáticos. Por favor carga un archivo manual.
                     </p>
                     <button onClick={handleLogout} className="ml-4 text-sm underline text-slate-600">Salir</button>
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

  const scrollNav = (direction: 'left' | 'right') => {
    if (navRef.current) {
        const scrollAmount = 200;
        if (direction === 'left') {
            navRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-2 sm:py-0 gap-2 sm:gap-0">
            
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <span className="font-bold text-xl tracking-wider truncate">DASHBOARD</span>
              <div className="flex items-center sm:hidden">
                 {user?.role === 'ADMINISTRADOR' && (
                     <button onClick={() => navigate('/admin-users')} className="p-2 text-slate-400 hover:text-white">
                         <Users className="w-5 h-5"/>
                     </button>
                 )}
                 <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white">
                    <LogOut className="w-5 h-5" />
                 </button>
              </div>
            </div>
            
            <div className="w-full sm:w-auto flex items-center gap-1 mt-2 sm:mt-0">
                <button 
                    onClick={() => scrollNav('left')}
                    className="sm:hidden p-1 text-slate-400 hover:text-white focus:outline-none"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <nav 
                    ref={navRef}
                    className="flex space-x-1 w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth"
                >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 border border-transparent ${
                        isActive
                            ? 'bg-slate-700 text-white shadow-inner border-slate-600'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        {item.label}
                    </NavLink>
                    );
                })}
                </nav>

                <button 
                    onClick={() => scrollNav('right')}
                    className="sm:hidden p-1 text-slate-400 hover:text-white focus:outline-none"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            <div className="hidden sm:flex items-center space-x-2 ml-4">
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
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
};