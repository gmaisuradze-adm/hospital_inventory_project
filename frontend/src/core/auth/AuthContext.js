import React, { createContext, useState, useContext, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import api from '../api/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Check if token is expired
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token expired
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }

        // Set API default header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user data
        const response = await api.get('/api/auth/user');
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem('token');
        setError('Authentication failed. Please log in again.');
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    console.log('Login attempt with:', credentials);
    
    try {
      const response = await api.post('/api/auth/login', credentials);
      console.log('Login response:', response.data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
