import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth, useUser, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import useAuthStore from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';

// --- LAYOUTS ---
import Sidebar from './components/layout/Sidebar';       
import SkeletonLayout from './components/layout/SkeletonLayout';

// --- AUTH PAGES ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// --- DASHBOARD PAGES ---
import DonorDashboard from './pages/donor/DonorDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import OrgDashboard from './pages/org/OrgDashboard';
import NotFound from './pages/NotFound';

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

// 1. DashboardLayout (Sidebar + Content) - FORCED BLACK
const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 md:ml-64 relative bg-black">
        <div className="p-4 md:p-8 min-h-screen">
           <Outlet />
        </div>
      </div>
    </div>
  );
};

// 2. LandingLayout - FORCED BLACK (No Navbar)
const LandingLayout = () => (
    <div className="min-h-screen bg-black text-white">
        <div className="w-full h-full">
            <Outlet />
        </div>
    </div>
);

const Root = () => {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) return <SkeletonLayout />;

  if (isSignedIn) {
    const role = user?.unsafeMetadata?.role;
    if (role === 'hospital') return <Navigate to="/hospital/dashboard" replace />;
    if (role === 'organization') return <Navigate to="/org/dashboard" replace />;
    return <Navigate to="/donor/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  const { isLoaded } = useUser();

  return (
    <BrowserRouter>
      <AuthWrapper>
        <Routes>
          <Route path="/" element={<Root />} />

          <Route element={<LandingLayout />}>
             <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
          </Route>

          <Route path="/login/*" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={isLoaded ? <DashboardLayout /> : <SkeletonLayout />}>
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/org/dashboard" element={<OrgDashboard />} />
            <Route path="/settings" element={<div className="text-white p-8">Settings Page</div>} />
          </Route>

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
        className: 'bg-zinc-900 text-white border border-zinc-800',
        style: { borderRadius: '10px', background: '#18181b', color: '#fff' },
      }} 
    />
    <App />
  </ThemeProvider>
);

export default AppWrapper;