import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Fetch current user details from MongoDB using the Clerk token
  checkUser: async (token) => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data.data, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("User fetch error:", err);
      set({ user: null, isAuthenticated: false, isLoading: false, error: err.response?.data?.message });
    }
  },

  // Onboarding function
  onboard: async (formData, token) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/onboarding', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data.data, isAuthenticated: true, isLoading: false });
      return res.data;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message });
      throw err;
    }
  },
  
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export default useAuthStore;