import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth, useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import useAuthStore from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';

// --- LAYOUTS ---
import Sidebar from './components/layout/Sidebar';       // New Sidebar
import Navbar from './components/layout/Navbar';         // Existing Navbar
import SkeletonLayout from './components/layout/SkeletonLayout'; // New Skeleton

// --- AUTH PAGES ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// --- DASHBOARD PAGES ---
import DonorDashboard from './pages/donor/DonorDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import OrgDashboard from './pages/org/OrgDashboard';
import NotFound from './pages/NotFound';

// --- COMPONENTS & WRAPPERS ---

// 1. AuthWrapper: Syncs Clerk Auth with your MongoDB/Zustand Store
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

// 2. DashboardLayout: The "App" View (Sidebar + Content)
const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Sidebar is fixed on desktop, hidden on mobile (handled inside Sidebar component) */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 relative">
        {/* You can add a Mobile Header here if needed for small screens */}
        <div className="p-4 md:p-8 min-h-screen">
           <Outlet />
        </div>
      </div>
    </div>
  );
};

// 3. LandingLayout: The "Public" View (Navbar + Content)
const LandingLayout = () => (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <Navbar />
        <div className="pt-16">
            <Outlet />
        </div>
    </div>
);

// 4. Root Controller: Handles Redirects & Loading States
const Root = () => {
  const { isSignedIn, user, isLoaded } = useUser();

  // INSTANT FEEL: Show Skeleton instead of spinner while loading
  if (!isLoaded) {
    return <SkeletonLayout />;
  }

  if (isSignedIn) {
    // Redirect based on role
    const role = user?.unsafeMetadata?.role;
    if (role === 'hospital') return <Navigate to="/hospital/dashboard" replace />;
    if (role === 'organization') return <Navigate to="/org/dashboard" replace />;
    return <Navigate to="/donor/dashboard" replace />;
  }

  // If not signed in, go to Login (or Landing page if you prefer)
  return <Navigate to="/login" replace />;
};

// --- MAIN APP COMPONENT ---

function App() {
  const { isLoaded } = useUser();

  return (
    <BrowserRouter>
      <AuthWrapper>
        <Routes>
          {/* Entry Point */}
          <Route path="/" element={<Root />} />

          {/* --- PUBLIC / AUTH ROUTES --- */}
          <Route element={<LandingLayout />}>
             {/* Add a specific landing page component here if you have one, e.g., <Home /> */}
             <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
          </Route>

          <Route path="/login/*" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* --- PROTECTED DASHBOARD ROUTES --- */}
          {/* We wrap these in the Sidebar Layout */}
          <Route element={isLoaded ? <DashboardLayout /> : <SkeletonLayout />}>
            
            {/* Donor Routes */}
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            {/* <Route path="/donor/history" element={<History />} /> */}
            {/* <Route path="/donor/camps" element={<Camps />} /> */}

            {/* Hospital Routes */}
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            {/* <Route path="/hospital/inventory" element={<Inventory />} /> */}

            {/* Org Routes */}
            <Route path="/org/dashboard" element={<OrgDashboard />} />
            
            {/* Global Settings */}
            <Route path="/settings" element={<div className="text-white">Settings Page</div>} />
          </Route>

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthWrapper>
    </BrowserRouter>
  );
}

// Global Providers Wrapper
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