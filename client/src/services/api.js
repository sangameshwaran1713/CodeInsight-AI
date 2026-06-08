import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // If no env var, use current host but port 5000
  const host = window.location.hostname;
  return `http://${host}:5000/api`;
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes for AI analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again with smaller code.';
    }
    
    // Handle network errors
    if (!error.response && error.message === 'Network Error') {
      error.message = 'Unable to connect to server. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// Health check function
export const checkHealth = async () => {
  try {
    const response = await api.get('/health/full', { timeout: 5000 });
    return response.data;
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};

export default api;
