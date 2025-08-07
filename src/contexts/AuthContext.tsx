import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, db, STORAGE_KEYS } from '@/utils/database';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: ['admin'],
  MANAGE_SETTINGS: ['admin'],
  VIEW_REPORTS: ['admin', 'trainer'],
  MANAGE_EXPENSES: ['admin'],
  MANAGE_SALARIES: ['admin', 'trainer'],
  
  // Staff management
  MANAGE_STAFF: ['admin', 'trainer', 'receptionist'],
  
  // Member management
  ADD_MEMBER: ['admin', 'receptionist'],
  EDIT_MEMBER: ['admin', 'receptionist'],
  DELETE_MEMBER: ['admin'],
  VIEW_MEMBERS: ['admin', 'receptionist', 'trainer'],
  
  // Body measurements
  ADD_MEASUREMENTS: ['admin', 'trainer'],
  VIEW_MEASUREMENTS: ['admin', 'trainer'],
  
  // Attendance
  MARK_ATTENDANCE: ['admin', 'receptionist'],
  VIEW_ATTENDANCE: ['admin', 'receptionist', 'trainer'],
  
  // Financial
  CREATE_RECEIPTS: ['admin', 'receptionist'],
  VIEW_RECEIPTS: ['admin', 'receptionist', 'trainer'],
  MANAGE_RECEIPTS: ['admin', 'receptionist'],
  
  // Enquiries
  VIEW_ENQUIRIES: ['admin', 'receptionist', 'trainer'],
  MANAGE_ENQUIRIES: ['admin', 'receptionist'],
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session in sessionStorage (more secure than localStorage for auth)
    const currentUser = sessionStorage.getItem('gym_current_user');
    if (currentUser) {
      try {
        setUser(JSON.parse(currentUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        sessionStorage.removeItem('gym_current_user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const foundUser = await db.authenticateUser(username, password);
      
      if (foundUser) {
        setUser(foundUser);
        sessionStorage.setItem('gym_current_user', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = (): void => {
    setUser(null);
    sessionStorage.removeItem('gym_current_user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
    return allowedRoles ? allowedRoles.includes(user.role) : false;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};