import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, login as apiLogin, logout as apiLogout, registerLogoutCallback } from '../api/client';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = await getAuthToken();
      if (storedToken) {
        setToken(storedToken);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Register callback to handle 401s from client.ts
    registerLogoutCallback(() => {
      setToken(null);
    });
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const data = await apiLogin(email, pass);
      setToken(data.access_token);
      // router.replace('/'); // Handled by ProtectedLayout in _layout
    } catch (e) {
      throw e;
    }
  };

  const logout = async () => {
    await apiLogout();
    setToken(null);
    // router.replace('/login'); // Handled by ProtectedLayout in _layout
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
