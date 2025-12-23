import React from 'react';
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const PublicRoute = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useUser();

  // 1. Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  // 2. If User is Signed In, Redirect them!
  if (isSignedIn) {
    const role = user?.unsafeMetadata?.role || 'donor';
    
    // Logic: 
    // - Hospitals go to /hospital/dashboard. 
    //   (Your HospitalDashboard.jsx already handles showing the "Verification Pending" screen if they aren't verified)
    if (role === 'hospital') {
        return <Navigate to="/hospital/dashboard" replace />;
    }
    
    if (role === 'organization') {
        return <Navigate to="/org/dashboard" replace />;
    }

    // Default: Donor
    return <Navigate to="/donor/dashboard" replace />;
  }

  // 3. If NOT Signed In, render the children (Login/Register page)
  return children;
};

export default PublicRoute;