import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { mockUserProfile } from '../data/mockData';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string, career: string) => Promise<boolean>;
  logout: () => void;
  updateCareerGoal: (newCareer: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('pathforge_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...mockUserProfile,
          ...parsed,
          stats: {
            ...mockUserProfile.stats,
            ...(parsed?.stats || {}),
          },
        };
      } catch (e) {
        return mockUserProfile;
      }
    }
    return mockUserProfile; // Default logged in for smooth demo review
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('pathforge_auth') !== 'false';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('pathforge_user', JSON.stringify(user));
    }
  }, [user]);

  const login = async (email: string, _pass: string): Promise<boolean> => {
    // Mock login
    await new Promise((resolve) => setTimeout(resolve, 600));
    const updated = {
      ...mockUserProfile,
      email: email || mockUserProfile.email,
    };
    setUser(updated);
    setIsAuthenticated(true);
    localStorage.setItem('pathforge_auth', 'true');
    return true;
  };

  const register = async (name: string, email: string, _pass: string, career: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newUser: UserProfile = {
      ...mockUserProfile,
      name: name || 'Explorer',
      email: email || 'user@example.com',
      targetCareer: career || 'Data Analyst',
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('pathforge_auth', 'true');
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('pathforge_auth', 'false');
  };

  const updateCareerGoal = (newCareer: string) => {
    if (user) {
      setUser({
        ...user,
        targetCareer: newCareer,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        updateCareerGoal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
