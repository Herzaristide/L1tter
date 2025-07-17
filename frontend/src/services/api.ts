import axios from 'axios';
import { AuthResponse, User } from '../types';

const API_BASE_URL = (() => {
  // If we're in a Codespace
  if (
    window.location.hostname.includes('github.dev') ||
    window.location.hostname.includes('app.github.dev')
  ) {
    // Use the same hostname but replace the port with 3001
    const url = process.env.REACT_APP_CODESPACE_API_URL;
    return url;
  }
  // Otherwise use environment variable or localhost
  const url = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  return url;
})();

console.log('Final API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  register: async (
    name: string,
    email: string,
    password: string,
    adminKey?: string
  ): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      adminKey,
    });
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export default api;
