import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, db, STORAGE_KEYS } from '@/utils/database';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check for existing session in sessionStorage (more secure than localStorage for auth)
    const currentUser = sessionStorage.getItem('gym_current_user');
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser);
        setUser(parsedUser);
        // Load role permissions if not admin
        if (parsedUser.role !== 'admin') {
          loadRolePermissions(parsedUser.role);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        sessionStorage.removeItem('gym_current_user');
      }
    }
  }, []);

  const loadRolePermissions = async (role: string) => {
    try {
      const permissions = await db.getRolePermissions(role);
      const permMap: Record<string, boolean> = {};
      permissions.forEach((perm: { permission: string; enabled: number }) => {
        permMap[perm.permission] = perm.enabled === 1;
      });
      setRolePermissions(permMap);
    } catch (error) {
      console.error('Error loading role permissions:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const foundUser = await db.authenticateUser(username, password);
      
      if (foundUser) {
        setUser(foundUser);
        sessionStorage.setItem('gym_current_user', JSON.stringify(foundUser));
        // Load role permissions if not admin
        if (foundUser.role !== 'admin') {
          await loadRolePermissions(foundUser.role);
        }
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

  const refreshUser = async (): Promise<void> => {
    if (!user) return;
    
    try {
      // Fetch updated user data from database
      const users = await db.getAllUsers();
      const updatedUser = users.find(u => u.id === user.id);
      
      if (updatedUser) {
        setUser(updatedUser);
        sessionStorage.setItem('gym_current_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin always has all permissions
    if (user.role === 'admin') {
      return true;
    }
    
    // For other roles, check database permissions
    if (rolePermissions[permission] !== undefined) {
      return rolePermissions[permission];
    }
    
    // Fallback to default permissions if not in database
    const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
    return allowedRoles ? allowedRoles.includes(user.role) : false;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      refreshUser,
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