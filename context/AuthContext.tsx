import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos de usuario
export interface User {
  username: string;
  role: 'ADMINISTRADOR' | 'VISUALIZADOR';
  pass?: string; // Optional for internal use, required for saving
}

interface AuthContextType {
  user: User | null;
  isLoadingAuth: boolean;
  login: (username: string, pass: string, remember?: boolean) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, pass: string, role: User['role']) => Promise<{success: boolean, msg: string}>;
  getUsers: () => any[]; // Local cache of users for display
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'app_session_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Cargar usuarios desde la API al iniciar
  const fetchUsers = async () => {
    try {
        const res = await fetch('/api/users');
        if (res.ok) {
            const data = await res.json();
            setUsersList(data);
            // Fallback si la lista está vacía (Sheet nuevo)
            if (data.length === 0) {
               console.warn("La hoja de usuarios está vacía. Usa el usuario de emergencia si configuraste uno o revisa la API.");
            }
        } else {
            console.error("Error fetching users api");
        }
    } catch (e) {
        console.error("Error conectando con /api/users", e);
    }
  };

  useEffect(() => {
    // Restaurar sesión
    const savedSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
    
    // Cargar base de datos de usuarios
    fetchUsers();
  }, []);

  const login = async (username: string, pass: string, remember: boolean = false) => {
    setIsLoadingAuth(true);
    
    // Refrescamos la lista antes de login por si acaso hubo cambios recientes
    await fetchUsers(); 
    
    // Verificamos contra la lista en memoria (recién actualizada)
    const found = usersList.find((u: any) => u.username === username && u.pass === pass);
    
    // Backdoor de emergencia (hardcoded) por si falla la API
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
    // 1. Validar si existe localmente primero
    if (usersList.find((u: any) => u.username === username)) {
        return { success: false, msg: 'El usuario ya existe' };
    }

    try {
        // 2. Enviar a la API
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pass, role })
        });

        if (res.ok) {
            // 3. Actualizar estado local optimistamente o recargar
            setUsersList([...usersList, { username, pass, role }]);
            return { success: true, msg: 'Usuario creado y guardado en Google Sheets' };
        } else {
            return { success: false, msg: 'Error al guardar en el servidor' };
        }
    } catch (e) {
        return { success: false, msg: 'Error de conexión' };
    }
  };

  const getUsers = () => {
    return usersList;
  };

  return (
    <AuthContext.Provider value={{ user, isLoadingAuth, login, logout, createUser, getUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};