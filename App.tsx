import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';
import { TopNegativePage } from './pages/TopNegativePage';
import { TopOverstockPage } from './pages/TopOverstockPage';
import { SalesRankingPage } from './pages/SalesRankingPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

const ProtectedRoute = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/" replace />;
    return <Layout />;
};

const AdminRoute = () => {
    const { user } = useAuth();
    if (user?.role !== 'ADMINISTRADOR') return <Navigate to="/inventory" replace />;
    return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="top-negative" element={<TopNegativePage />} />
              <Route path="top-overstock" element={<TopOverstockPage />} />
              <Route path="ranking" element={<SalesRankingPage />} />
              
              <Route element={<AdminRoute />}>
                  <Route path="admin-users" element={<AdminUsersPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;