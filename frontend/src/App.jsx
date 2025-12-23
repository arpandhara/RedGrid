import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth, useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import useAuthStore from './store/useAuthStore';
import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Layouts
import Navbar from './components/layout/Navbar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Placeholders
import DonorDashboard from './pages/donor/DonorDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import OrgDashboard from './pages/org/OrgDashboard';

// 1. Import the new Professional 404 Page
import NotFound from './pages/NotFound';

// --- COMPONENTS ---

const Root = () => {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (isSignedIn) {
    const role = user?.unsafeMetadata?.role;
    if (role === 'hospital') return <Navigate to="/hospital/dashboard" replace />;
    if (role === 'organization') return <Navigate to="/org/dashboard" replace />;
    return <Navigate to="/donor/dashboard" replace />;
  }

  return <Navigate to="/register" replace />;
};

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

const MainLayout = () => (
  <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
    <Navbar />
    <Outlet />
  </div>
);

// --- MAIN APP ---

function App() {
  return (
    <BrowserRouter>
      <AuthWrapper>
        <Routes>
          {/* Root Entry */}
          <Route path="/" element={<Root />} />

          {/* Auth Routes */}
          <Route path="/register/*" element={<Register />} />
          <Route path="/login/*" element={<Login />} />
          <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

          {/* Protected Dashboards */}
          <Route element={<MainLayout />}>
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/org/dashboard" element={<OrgDashboard />} />
          </Route>

          {/* 2. Use the imported NotFound component */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthWrapper>
    </BrowserRouter>
  );
}

const AppWrapper = () => (
  <ThemeProvider>
    <Toaster 
      position="top-right"
      toastOptions={{
        className: 'dark:bg-gray-800 dark:text-white',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      }} 
    />
    <App />
  </ThemeProvider>
);

export default AppWrapper;