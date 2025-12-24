import axios from 'axios';

const api = axios.create({
  // FIX: Remove hardcoded URL. Let Vite proxy handle it.
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;