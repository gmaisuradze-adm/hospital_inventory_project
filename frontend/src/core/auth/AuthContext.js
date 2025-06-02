import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

import config from '../config';

// Set axios base URL for API calls
axios.defaults.baseURL = config.apiUrl;
console.log('Setting axios baseURL to:', config.apiUrl);

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

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user data
        const response = await axios.get('/api/auth/user'); // Ensure this path is relative to baseURL
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
    console.log('Axios baseURL:', axios.defaults.baseURL);
    console.log('REACT_APP_API_URL from env:', process.env.REACT_APP_API_URL); // Log the env variable
    
    try {
      const response = await axios.post('/api/auth/login', credentials); // Ensure this path is relative to baseURL
      console.log('Login response:', response.data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
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
    delete axios.defaults.headers.common['Authorization'];
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
