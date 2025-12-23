import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import OnboardingWizard from '../../components/onboarding/OnboardingWizard';

const OrgDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
       {/* THE WIZARD - Renders conditionally */}
       {user && !user.isOnboarded && <OnboardingWizard />}
       
       <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-bold dark:text-white">Dashboard Content</h1>
          {/* ... Rest of your dashboard ... */}
       </div>
    </div>
  );
};

export default OrgDashboard;