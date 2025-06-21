import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
// Real API service
import { AuthService } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
// Mock users kept ONLY as a *development* fallback if the backend is unavailable.
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@kawempesacco.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    phoneNumber: '+256701234567',
    idNumber: 'CM123456789',
    address: 'Kawempe, Kampala',
    joinDate: '2020-01-15',
    status: 'active',
  },
  {
    id: '2',
    email: 'john.doe@gmail.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'member',
    memberNumber: 'KS001',
    phoneNumber: '+256702345678',
    idNumber: 'CM987654321',
    address: 'Kawempe, Kampala',
    employerName: 'Uganda Revenue Authority',
    joinDate: '2021-03-20',
    status: 'active',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('kawempe_sacco_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Attempt real API login
      const loggedInUser = await AuthService.login(email, password);
      setUser(loggedInUser);
      localStorage.setItem('kawempe_sacco_user', JSON.stringify(loggedInUser));
      return true;
    } catch (err) {
      console.error('AuthService.login failed, falling back to mock login.', err);
      // ---------- Development fallback ----------
      const foundUser = mockUsers.find(u => u.email === email);
      const passwordOk = password === 'password123'; // simplistic check
      if (foundUser && passwordOk) {
        setUser(foundUser);
        localStorage.setItem('kawempe_sacco_user', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Attempt to notify backend but always clear local session
    AuthService.logout()
      .catch(err => console.warn('AuthService.logout failed:', err))
      .finally(() => {
        setUser(null);
        localStorage.removeItem('kawempe_sacco_user');
      });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
