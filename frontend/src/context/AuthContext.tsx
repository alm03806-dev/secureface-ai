import { store } from '../lib/storage';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, UserOut } from '../api/authApi';

interface AuthContextType {
  currentUser: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (token: string, username: string, role: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => store.get('secureface_token'));
  const [currentUser, setCurrentUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
      store.remove('secureface_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (newToken: string) => {
    store.set('secureface_token', newToken);
    setToken(newToken);
    setLoading(true);
    await fetchProfile();
  };

  const logout = () => {
    store.remove('secureface_token');
    setToken(null);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile();
    }
  };

  const isAuthenticated = !!token && !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, token, isAuthenticated, isAdmin, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
