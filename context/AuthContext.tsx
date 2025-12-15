import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos de usuario
export interface User {
  username: string;
  role: 'ADMINISTRADOR' | 'VISUALIZADOR';
  pass?: string; // Optional for internal use, required for saving
}

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string, remember?: boolean) => boolean;
  logout: () => void;
  createUser: (username: string, pass: string, role: User['role']) => boolean;
  getUsers: () => any[]; // For admin list
  importUsers: (newUsers: any[]) => void; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'app_users_db';
const SESSION_KEY = 'app_session_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Inicializar DB de usuarios si no existe
  useEffect(() => {
    const existingUsers = localStorage.getItem(USERS_KEY);
    if (!existingUsers) {
      const initialUsers = [
        { username: 'ADMIN', pass: '123456', role: 'ADMINISTRADOR' }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    }

    // Restaurar sesión (Buscar en LocalStorage primero, luego en SessionStorage)
    const savedSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
  }, []);

  const login = (username: string, pass: string, remember: boolean = false) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const found = users.find((u: any) => u.username === username && u.pass === pass);
    if (found) {
      const userObj = { username: found.username, role: found.role };
      setUser(userObj as User);
      
      // Guardar sesión según la preferencia de "Confiar en este dispositivo"
      if (remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    // Limpiar ambos almacenamientos por seguridad
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const createUser = (username: string, pass: string, role: User['role']) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: any) => u.username === username)) {
        return false; // User exists
    }
    users.push({ username, pass, role });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  };

  const getUsers = () => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]').map((u: any) => ({
        username: u.username,
        role: u.role,
        pass: u.pass // Incluimos pass para poder exportar, aunque cuidado con seguridad en apps reales
    }));
  };

  const importUsers = (newUsers: any[]) => {
      // Validamos estructura básica
      const validUsers = newUsers.filter(u => u.username && u.pass && (u.role === 'ADMINISTRADOR' || u.role === 'VISUALIZADOR'));
      if (validUsers.length > 0) {
          localStorage.setItem(USERS_KEY, JSON.stringify(validUsers));
      }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, createUser, getUsers, importUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};