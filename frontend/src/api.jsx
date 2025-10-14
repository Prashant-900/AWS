import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    // Don't add auth headers for login/register endpoints
    const isAuthEndpoint = config.url?.includes('/user/login/') || config.url?.includes('/user/register/');
    
    if (!isAuthEndpoint) {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 or 500 error on token refresh, clear tokens
    if (error.response) {
      const isTokenRefresh = error.config?.url?.includes('/token/refresh/');
      
      if (isTokenRefresh && (error.response.status === 401 || error.response.status === 500)) {
        console.log('Token refresh failed, clearing tokens');
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
