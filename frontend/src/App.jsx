import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth, useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import useAuthStore from './store/useAuthStore';
import { Loader } from 'lucide-react';

// Layouts
import Navbar from './components/layout/Navbar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Placeholders
import DonorDashboard from './pages/donor/DonorDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import OrgDashboard from './pages/org/OrgDashboard';

// --- COMPONENTS ---

// 1. Root Component: The "Traffic Controller"
// If logged in -> Go to Dashboard. If logged out -> Go to Register.
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
    // Intelligent routing based on role
    if (role === 'hospital') return <Navigate to="/hospital/dashboard" replace />;
    if (role === 'organization') return <Navigate to="/org/dashboard" replace />;
    return <Navigate to="/donor/dashboard" replace />;
  }

  // DEFAULT ENTRY POINT: Register Page
  return <Navigate to="/register" replace />;
};

// 2. Auth Wrapper: Syncs Clerk state with your Zustand store
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

// 3. Main Layout: Only for pages that NEED the Navbar (Dashboards)
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
          {/* ENTRY POINT: Redirects to Register or Dashboard */}
          <Route path="/" element={<Root />} />

          {/* AUTH ROUTES (Full Screen, No Navbar) */}
          <Route path="/register/*" element={<Register />} />
          <Route path="/login/*" element={<Login />} />
          
          {/* Clerk OAuth Callback */}
          <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

          {/* PROTECTED DASHBOARD ROUTES (With Navbar) */}
          <Route element={<MainLayout />}>
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/org/dashboard" element={<OrgDashboard />} />
          </Route>
        </Routes>
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