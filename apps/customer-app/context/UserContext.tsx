import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProfile as fetchProfile } from '@/api/services';
import { logout, registerLogoutCallback } from '@/api/client';
import { useRouter } from 'expo-router';

// Define the shape of our User data
interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  customer?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  role: string;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateUserLocal: (updates: Partial<UserProfile>) => void;
  logoutUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    try {
      const token = await import('@/api/client').then(m => m.getAuthToken());
      if (!token) {
          setLoading(false);
          return;
      }
      setLoading(true);
      const profile = await fetchProfile();
      if (profile) {
        setUser(profile);
      } else {
        // If profile fetch fails (e.g., token expired), maybe clear user
        // But don't force logout immediately unless 401
        // setUser(null); 
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    registerLogoutCallback(() => {
      setUser(null);
      router.replace('/login');
    });
    refreshProfile();
  }, [refreshProfile, router]);

  const updateUserLocal = (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const logoutUser = async () => {
    await logout();
    setUser(null);
    router.replace('/login');
  };

  return (
    <UserContext.Provider value={{ user, loading, refreshProfile, updateUserLocal, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
