import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from '../types/roles';
import { defaultLandingRouteByRole } from '../types/roles';

/**
 * User object structure
 */
export interface User {
  id: string;
  name: string;
  firstName: string;
  role: UserRole;
}

/**
 * Auth context value shape
 */
interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  loginMock: (name: string, role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  getDefaultRoute: () => string;
}

/**
 * Local storage key for persisting auth state
 */
const AUTH_STORAGE_KEY = 'nexskill_mock_auth';

/**
 * Create the auth context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component - manages mock authentication state
 * Persists user session to localStorage for cross-tab/reload consistency
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load persisted auth state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Failed to load auth state from localStorage:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  /**
   * Mock login - accepts name and role, generates fake user ID
   * Extracts first name from full display name for personalized greetings
   */
  const loginMock = (name: string, role: UserRole) => {
    const trimmedName = name.trim() || 'Anonymous User';
    // Extract first name (first word before any space)
    const firstName = trimmedName.split(' ')[0];
    
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      firstName,
      role,
    };

    setCurrentUser(user);
    
    // Persist to localStorage
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to persist auth state to localStorage:', error);
    }
  };

  /**
   * Logout - clears user state and localStorage
   */
  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear auth state from localStorage:', error);
    }
  };

  /**
   * Switch role (dev/testing utility) - keeps same user but changes role
   */
  const switchRole = (role: UserRole) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      role,
    };

    setCurrentUser(updatedUser);
    
    // Persist to localStorage
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to persist auth state to localStorage:', error);
    }
  };

  /**
   * Get default landing route for current user's role
   */
  const getDefaultRoute = (): string => {
    if (!currentUser) return '/login';
    return defaultLandingRouteByRole[currentUser.role];
  };

  const value: AuthContextValue = {
    currentUser,
    isAuthenticated: !!currentUser,
    loginMock,
    logout,
    switchRole,
    getDefaultRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to consume auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
