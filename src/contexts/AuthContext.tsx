import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

interface User {
  phone: string;
  name: string;
  email: string;
  gender: string;
  date_of_birth: string;
  place: string;
  id: string;
  is_active: boolean;
  has_given_consent: boolean;
  consent_given_at: string;
  last_login_at: string;
  created_at: string;
  updated_at: string;
  // Keep legacy fields for compatibility
  username?: string;
  contributionsCount?: number;
  badgesEarned?: string[];
  joinedDate?: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (name: string, phone: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has a token and fetch user data
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await apiService.getMe(token);
          setUser(userData);
        } catch (error) {
          console.error('Error checking authentication:', error);
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const data = await apiService.login(phone, password);
      localStorage.setItem('access_token', data.access_token);
      
      // Fetch user data after successful login
      const userData = await apiService.getMe(data.access_token);
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, phone: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      await apiService.register(name, phone, email, password);
      // After successful registration, automatically log in
      const loginSuccess = await login(phone, password);
      setIsLoading(false);
      return loginSuccess;
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};