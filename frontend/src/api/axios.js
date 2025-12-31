import axios from 'axios';

const api = axios.create({
  // Use Environment Variable for API URL (Flexible for Deployment)
  baseURL: import.meta.env.VITE_API_URL || '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to dynamically inject the token
api.interceptors.request.use(async (config) => {
  const token = await window.Clerk?.session?.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;