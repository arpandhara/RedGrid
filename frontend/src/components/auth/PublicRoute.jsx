import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import useAuthStore from '../../store/useAuthStore';
import SkeletonLayout from '../layout/SkeletonLayout';

const PublicRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();
  const { user, isLoading } = useAuthStore();

  if (!isLoaded || isLoading) {
    return <SkeletonLayout />;
  }

  if (isSignedIn) {
    // If logged in, redirect to appropriate dashboard based on role
    // We can redirect to "/" which handles role-based redirection via the Root component logic
    // OR replicate the logic here for directness.
    
    // Safety check: if user data isn't fully synced yet but Clerk says signed in, 
    // we might want to wait or send to onboarding if that's the state.
    
    if (user && !user.isOnboarded) {
        return <Navigate to="/onboarding" replace />;
    }

    if (user) {
        if (user.role === 'hospital') return <Navigate to="/hospital/dashboard" replace />;
        if (user.role === 'organization') return <Navigate to="/org/dashboard" replace />;
        return <Navigate to="/donor/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default PublicRoute;
