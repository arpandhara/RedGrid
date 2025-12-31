import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import {
  useAuth,
  useUser,
  AuthenticateWithRedirectCallback,
} from "@clerk/clerk-react";
import useAuthStore from "./store/useAuthStore";
import { Toaster } from "react-hot-toast";

// --- LAYOUTS ---
import Sidebar from "./components/layout/Sidebar";
import SkeletonLayout from "./components/layout/SkeletonLayout";

// --- AUTH PAGES ---
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// --- DASHBOARD PAGES ---
import DonorDashboard from "./pages/donor/DonorDashboard";
import DonorHub from './pages/donor/DonorHub'; // New Import
import UserScanner from './pages/donor/UserScanner'; // New Scanner Import
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import OrgDashboard from "./pages/org/OrgDashboard";
import NotFound from "./pages/NotFound";
import Settings from "./pages/settings/Settings";
import CreateRequest from "./pages/hospital/CreateRequest";
import Inventory from "./pages/hospital/Inventory";
import ManageRequests from "./pages/hospital/ManageRequests";
import Notifications from "./pages/donor/Notifications";
import History from "./pages/donor/History";
import RewardsMarketplace from "./pages/donor/RewardsMarketplace";
import Leaderboard from "./pages/Leaderboard"; // New Import // New Import

import VerifyDonation from "./pages/hospital/VerifyDonation";
import OnboardingWizard from "./components/onboarding/OnboardingWizard";

// --- AUTH COMPONENTS ---
import PublicRoute from "./components/auth/PublicRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
  const { user, isLoading } = useAuthStore();
  const { isLoaded, isSignedIn } = useUser();

  // 1. Wait for Clerk + MongoDB Sync
  // Fix Flash: If signed in but no DB user yet, keep loading
  if (!isLoaded || isLoading || (isSignedIn && !user)) return <SkeletonLayout />;

  // 2. If not signed in (should be handled by Root/AuthWrapper but double check)
  if (!isSignedIn) return <Navigate to="/login" replace />;

  // 3. STRICT: If not onboarded, force to Onboarding
  if (user && !user.isOnboarded) {
      return <Navigate to="/onboarding" replace />;
  }

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
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const { user: dbUser, isLoading: dbLoading } = useAuthStore();

  if (!isLoaded || dbLoading) return <SkeletonLayout />;

  if (isSignedIn) {
    // If we have Clerk user but no DB user yet, wait or it will eventually load
    // BUT if we have DB user, check status
    if (dbUser && !dbUser.isOnboarded) {
        return <Navigate to="/onboarding" replace />;
    }

    const role = dbUser?.role || clerkUser?.unsafeMetadata?.role;
    
    if (role === "hospital")
      return <Navigate to="/hospital/dashboard" replace />;
    if (role === "organization")
      return <Navigate to="/org/dashboard" replace />;
    return <Navigate to="/donor/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  const { isLoaded } = useUser();

  return (
    <BrowserRouter>
      <AuthWrapper>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Root />} />

            <Route element={<LandingLayout />}>
              <Route
                path="/sso-callback"
                element={<AuthenticateWithRedirectCallback />}
              />
            </Route>

            {/* PUBLIC ROUTES (Redirects to Dashboard if logged in) */}
            <Route element={<PublicRoute />}>
                <Route path="/login/*" element={<Login />} />
                <Route path="/register/*" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            
            {/* PROTECTED ROUTES */}
            <Route element={<ProtectedRoute />}>
                {/* Onboarding Logic: ProtectedRoute allows access if signed in. 
                    OnboardingWizard itself handles checking if already onboarded (optional but good) */}
                <Route path="/onboarding" element={<OnboardingWizard />} />

                {/* Scanners */}
                <Route path="/donor/scan" element={<UserScanner />} />
            </Route>

            {/* DASHBOARD LAYOUT (Already Protected internally, but good to keep distinct) */}
            <Route
              element={isLoaded ? <DashboardLayout /> : <SkeletonLayout />}
            >
              <Route path="/donor/dashboard" element={<DonorDashboard />} />
              <Route path="/donor/hub" element={<DonorHub />} /> {/* New Route */}
              <Route path="/donor/notifications" element={<Notifications />} />
              <Route path="/donor/notifications" element={<Notifications />} />
              <Route path="/donor/history" element={<History />} />
              <Route path="/donor/rewards" element={<RewardsMarketplace />} />
              <Route path="/donor/leaderboard" element={<Leaderboard />} /> {/* New Route */} {/* New Route */}
              <Route
                path="/hospital/create-request"
                element={<CreateRequest />}
              />
              <Route
                path="/hospital/dashboard"
                element={<HospitalDashboard />}
              />
              <Route 
                path="/hospital/verify-donation" 
                element={<VerifyDonation />} 
              />
              <Route path="/hospital/inventory" element={<Inventory />} />
              <Route path="/hospital/notifications" element={<Notifications />} />
              <Route path="/hospital/manage-requests" element={<ManageRequests />} />
              <Route path="/org/dashboard" element={<OrgDashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SocketProvider>
      </AuthWrapper>
    </BrowserRouter>
  );
}

const AppWrapper = () => (
  <ThemeProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        className: "bg-zinc-900 text-white border border-zinc-800",
        style: { borderRadius: "10px", background: "#18181b", color: "#fff" },
      }}
      containerStyle={{
        zIndex: 99999,
      }}
    />
    <App />
  </ThemeProvider>
);

export default AppWrapper;
