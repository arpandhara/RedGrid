import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from '@clerk/clerk-react';
import useAuthStore from './store/useAuthStore';

// Layouts
import Navbar from './components/layout/Navbar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Placeholders (Create these files as well)
import DonorDashboard from './pages/donor/DonorDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import OrgDashboard from './pages/org/OrgDashboard';
import CustomAuth from './components/CustomAuth';

// Placeholder Landing
const LandingPage = () => (
  <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-4xl font-bold mb-4">Welcome to RedGrid</h1>
    <p className="text-gray-600 dark:text-gray-400">Connecting donors, hospitals, and organizations.</p>
  </div>
);

// Auth Wrapper to sync Clerk with Zustand
const AuthWrapper = ({ children }) => {
  const { isSignedIn, getToken } = useAuth();
  const { checkUser } = useAuthStore();

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn) {
        const token = await getToken();
        if (token) checkUser(token);
      }
    };
    syncUser();
  }, [isSignedIn, getToken, checkUser]);

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthWrapper>
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth Routes */}
            <Route path="/login/*" element={<Login />} />
            <Route path="/register/*" element={<Register />} />
            
            {/* Protected Routes (Add ProtectedRoute logic here later) */}
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/org/dashboard" element={<OrgDashboard />} />
          </Routes>
        </div>
      </AuthWrapper>
    </BrowserRouter>
  );
}

const AppWrapper = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWrapper;