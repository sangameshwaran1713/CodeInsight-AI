import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { hasPermission, isAdmin, isModerator, ROLES, PERMISSIONS } from '../config/roles.config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      sessionStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    sessionStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
    setIsAuthenticated(true);
    
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token, user } = response.data;
    
    sessionStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
    setIsAuthenticated(true);
    
    return response.data;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  // Role and permission checking functions
  const checkPermission = useCallback((permission) => {
    if (!user) return false;
    return hasPermission(user.role, permission, user.permissions || []);
  }, [user]);

  const checkIsAdmin = useCallback(() => {
    if (!user) return false;
    return isAdmin(user.role);
  }, [user]);

  const checkIsModerator = useCallback(() => {
    if (!user) return false;
    return isModerator(user.role);
  }, [user]);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }, [user]);

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    // Access control helpers
    checkPermission,
    checkIsAdmin,
    checkIsModerator,
    hasRole,
    // Re-export constants for convenience
    ROLES,
    PERMISSIONS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
