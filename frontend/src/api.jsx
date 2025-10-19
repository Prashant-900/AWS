import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";
import { getConfig } from "./config";

// Create API instance with dynamic base URL
const api = axios.create({
  baseURL: '', // fallback
});

// Function to update API base URL after config is loaded
export const updateApiConfig = () => {
  try {
    const config = getConfig();
    api.defaults.baseURL = config.API_URL;
  } catch {
    // Config not loaded yet, keep fallback
  }
};

// Try to update config immediately (in case it's already loaded)
updateApiConfig();

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
