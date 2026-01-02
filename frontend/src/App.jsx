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
// --- DASHBOARD PAGES (LAZY LOADED) ---
const DonorDashboard = React.lazy(() => import("./pages/donor/DonorDashboard"));
const DonorHub = React.lazy(() => import("./pages/donor/DonorHub"));
const DonorCamps = React.lazy(() => import("./pages/donor/DonorCamps")); // New Page
const UserScanner = React.lazy(() => import("./pages/donor/UserScanner"));
const HospitalDashboard = React.lazy(() => import("./pages/hospital/HospitalDashboard"));
const CampManage = React.lazy(() => import("./pages/org/CampManage"));
const OrgDashboard = React.lazy(() => import("./pages/org/OrgDashboard"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Settings = React.lazy(() => import("./pages/settings/Settings"));
const CreateRequest = React.lazy(() => import("./pages/hospital/CreateRequest"));
const Inventory = React.lazy(() => import("./pages/hospital/Inventory"));
const ManageRequests = React.lazy(() => import("./pages/hospital/ManageRequests"));
const Notifications = React.lazy(() => import("./pages/donor/Notifications"));
const History = React.lazy(() => import("./pages/donor/History"));
const RewardsMarketplace = React.lazy(() => import("./pages/donor/RewardsMarketplace"));
const Leaderboard = React.lazy(() => import("./pages/Leaderboard"));
const VerifyDonation = React.lazy(() => import("./pages/hospital/VerifyDonation"));

// --- COMPONENTS ---
import OnboardingWizard from "./components/onboarding/OnboardingWizard";
import LoadingFallback from "./components/common/LoadingFallback"; // New Import

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
        <React.Suspense fallback={<LoadingFallback />}>
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
              <Route path="/donor/hub" element={<DonorHub />} />
              <Route path="/donor/camps" element={<DonorCamps />} /> {/* New Route */}
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
              <Route path="/org/camps" element={<CampManage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
        </SocketProvider>
      </AuthWrapper>
    </BrowserRouter>
  );
}

import ErrorBoundary from "./components/common/ErrorBoundary";

const AppWrapper = () => (
  <ErrorBoundary>
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
  </ErrorBoundary>
);

export default AppWrapper;

