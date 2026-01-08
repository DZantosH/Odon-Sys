import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAdminToken, getAdminUser, setAdminAuth, clearAdminAuth } from '../config';

const AuthContext = createContext();

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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = getAdminToken();
      const userData = getAdminUser();
      
      if (token && userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      clearAdminAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData, role) => {
    setAdminAuth(token, userData, role);
    setUser(userData);
  };

  const logout = () => {
    clearAdminAuth();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};