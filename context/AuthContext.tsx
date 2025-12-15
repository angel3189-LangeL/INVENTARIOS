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
  login: (username: string, pass: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, pass: string, role: User['role']) => Promise<{success: boolean, msg: string}>;
  getUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'app_session_user';
const LOCAL_USERS_CACHE = 'app_users_cache';

// URL FIJA PARA USUARIOS - Actualizada con refs/heads/main explícitamente
const DEFAULT_USERS_URL = "https://raw.githubusercontent.com/angel3189-LangeL/DATOS/refs/heads/main/users.json";

const DEFAULT_USERS: User[] = [
    { username: 'ADMIN', pass: '123456', role: 'ADMINISTRADOR' }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Helper para convertir URL Raw de GitHub si es necesario
  const processUrl = (url: string) => {
      let finalUrl = url;
      // Corregir si el usuario pega un link de blob
      if (finalUrl.includes('github.com') && finalUrl.includes('/blob/')) {
          finalUrl = finalUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }
      // NOTA: Eliminada la limpieza de /refs/heads/ ya que la URL proporcionada lo requiere.
      
      return finalUrl;
  };

  const fetchUsers = async () => {
    try {
        const targetUrl = processUrl(DEFAULT_USERS_URL);
        // Agregamos timestamp para evitar caché agresivo del navegador
        console.log("Cargando usuarios desde:", targetUrl);
        const res = await fetch(`${targetUrl}?t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsersList(data);
                localStorage.setItem(LOCAL_USERS_CACHE, JSON.stringify(data)); // Actualizar caché
            } else {
                console.error("El JSON de usuarios no es un array válido");
            }
        } else {
            console.warn("No se pudo cargar el JSON de usuarios. Status:", res.status);
            // Fallback a caché
            const cached = localStorage.getItem(LOCAL_USERS_CACHE);
            if (cached) setUsersList(JSON.parse(cached));
        }
    } catch (e) {
        console.error("Error fetching users json", e);
        // Fallback a caché
        const cached = localStorage.getItem(LOCAL_USERS_CACHE);
        if (cached) setUsersList(JSON.parse(cached));
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
    
    // IMPORTANTE: No hacemos fetchUsers() aquí.
    // Si lo hacemos, sobrescribimos los usuarios creados localmente (pero no subidos a GitHub) con la versión vieja de GitHub.
    // Confiamos en la lista en memoria (usersList) o el caché local.

    // Obtenemos la lista más actualizada disponible localmente
    const cached = localStorage.getItem(LOCAL_USERS_CACHE);
    const currentList = cached ? JSON.parse(cached) : usersList;
    
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
        const updatedList = [...usersList, newUser];

        // Actualizamos estado y caché local inmediatamente
        setUsersList(updatedList);
        localStorage.setItem(LOCAL_USERS_CACHE, JSON.stringify(updatedList));

        // Generar archivo JSON para descargar
        const dataStr = JSON.stringify(updatedList, null, 2);
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

        return { 
            success: true, 
            msg: 'Usuario añadido LOCALMENTE. Se descargó "users.json". ¡Súbelo a GitHub para que funcione en otros PC!' 
        };

    } catch (e) {
        console.error(e);
        return { success: false, msg: 'Error al procesar la creación del usuario.' };
    }
  };

  const getUsers = () => {
    return usersList;
  };

  return (
    <AuthContext.Provider value={{ user, usersUrl: DEFAULT_USERS_URL, isLoadingAuth, login, logout, createUser, getUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};