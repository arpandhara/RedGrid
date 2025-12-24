import React from "react";
import useAuthStore from "../../store/useAuthStore";
import OnboardingWizard from "../../components/onboarding/OnboardingWizard";
// ... other imports

// Inside DonorDashboard.jsx
const DonorDashboard = () => {
  const { user } = useAuthStore();

  // While checking user status, show skeleton
  if (!user)
    return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  const needsOnboarding = !user.isOnboarded;

  return (
    <div
      className={`min-h-screen ${
        needsOnboarding ? "h-screen overflow-hidden" : ""
      }`}
    >
      {/* 1. Onboarding Wizard Overlay */}
      {needsOnboarding && (
        <div className="fixed inset-0 z-50">
          <OnboardingWizard />
        </div>
      )}

      {/* 2. Dashboard Content (Blurred if onboarding) */}
      <div
        className={`max-w-7xl mx-auto p-6 transition-all duration-500 ${
          needsOnboarding
            ? "blur-xl scale-95 opacity-50 pointer-events-none"
            : ""
        }`}
      >
        <h1 className="text-3xl font-bold dark:text-white">
          Welcome, {user.firstName}
        </h1>
        {/* ... content ... */}
      </div>
    </div>
  );
};

export default DonorDashboard;
