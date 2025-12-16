import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos de usuario
export interface User {
  username: string;
  role: 'ADMINISTRADOR' | 'VISUALIZADOR';
  pass?: string; 
}

interface AuthContextType {
  user: User | null;
  usersUrl: string;
  isLoadingAuth: boolean;
  authError: string | null;
  login: (username: string, pass: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, pass: string, role: User['role']) => Promise<{success: boolean, msg: string}>;
  downloadUsersJson: () => void;
  getUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'app_session_user';
const LOCAL_USERS_CACHE = 'app_users_cache';

// URL FIJA PARA USUARIOS - Eliminado 'refs/heads/'
const DEFAULT_USERS_URL = "https://raw.githubusercontent.com/angel3189-LangeL/datos-inventario/main/data/json/users.json";

const DEFAULT_USERS: User[] = [
    { username: 'ADMIN', pass: '123456', role: 'ADMINISTRADOR' }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Helper para limpiar URLs incorrectas (refs/heads)
  const processUrl = (url: string) => {
      let finalUrl = url;
      if (finalUrl.includes('github.com') && finalUrl.includes('/blob/')) {
          finalUrl = finalUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }
      if (finalUrl.includes('raw.githubusercontent.com') && finalUrl.includes('/refs/heads/')) {
          finalUrl = finalUrl.replace('/refs/heads/', '/');
      }
      
      return finalUrl;
  };

  const fetchUsers = async () => {
    setAuthError(null);
    try {
        const targetUrl = processUrl(DEFAULT_USERS_URL);
        // Agregamos timestamp para evitar caché agresivo del navegador
        console.log("Cargando usuarios desde:", targetUrl);
        const res = await fetch(`${targetUrl}?t=${Date.now()}`);
        
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status} al acceder a GitHub`);
        }

        const text = await res.text();
        
        try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                setUsersList(data);
                localStorage.setItem(LOCAL_USERS_CACHE, JSON.stringify(data)); // Actualizar caché
            } else {
                throw new Error("El archivo JSON no contiene un array de usuarios válido");
            }
        } catch (parseError: any) {
            throw new Error(`Error de sintaxis en el archivo JSON: ${parseError.message}`);
        }

    } catch (e: any) {
        console.error("Error fetching users json:", e);
        setAuthError(e.message);
        
        // Fallback a caché o usuarios por defecto
        const cached = localStorage.getItem(LOCAL_USERS_CACHE);
        if (cached) {
            try {
                setUsersList(JSON.parse(cached));
            } catch (cacheErr) {
                 setUsersList(DEFAULT_USERS);
            }
        } else {
            setUsersList(DEFAULT_USERS);
        }
    }
  };

  useEffect(() => {
    // Restaurar sesión
    const savedSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
    
    // Cargar usuarios al inicio
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, pass: string, remember: boolean = false) => {
    setIsLoadingAuth(true);
    
    // Obtenemos la lista más actualizada disponible localmente
    const cached = localStorage.getItem(LOCAL_USERS_CACHE);
    let currentList = usersList;
    if (cached) {
         try {
             currentList = JSON.parse(cached);
         } catch(e) { /* ignore */ }
    }
    
    if (currentList.length === 0) currentList = DEFAULT_USERS;
    
    // Verificamos credenciales
    const found = currentList.find((u: any) => u.username === username && u.pass === pass);
    
    // Backdoor de emergencia por si la lista remota falla o se borra y no hay caché
    const isEmergencyAdmin = username === 'ADMIN' && pass === '123456';

    if (found || isEmergencyAdmin) {
      const role = found ? found.role : 'ADMINISTRADOR';
      const userObj = { username: username, role: role };
      
      setUser(userObj as User);
      
      if (remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
      }
      setIsLoadingAuth(false);
      return true;
    }
    
    setIsLoadingAuth(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const createUser = async (username: string, pass: string, role: User['role']) => {
    // 1. Validar si existe localmente
    if (usersList.find((u: any) => u.username === username)) {
        return { success: false, msg: 'El usuario ya existe' };
    }

    try {
        const newUser: User = { username, pass, role };
        // Usamos functional update para asegurar que tenemos la lista más reciente
        setUsersList(prev => {
            const newList = [...prev, newUser];
            localStorage.setItem(LOCAL_USERS_CACHE, JSON.stringify(newList));
            return newList;
        });

        return { 
            success: true, 
            msg: 'Usuario añadido a la lista LOCAL. Recuerda descargar el JSON.' 
        };

    } catch (e) {
        console.error(e);
        return { success: false, msg: 'Error al procesar la creación del usuario.' };
    }
  };

  const downloadUsersJson = () => {
    // Generar archivo JSON para descargar
    const dataStr = JSON.stringify(usersList, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Crear elemento invisible para forzar la descarga
    const link = document.createElement("a");
    link.href = url;
    link.download = "users.json";
    document.body.appendChild(link);
    link.click();
    
    // Limpieza
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUsers = () => {
    return usersList;
  };

  return (
    <AuthContext.Provider value={{ user, usersUrl: DEFAULT_USERS_URL, isLoadingAuth, authError, login, logout, createUser, downloadUsersJson, getUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};