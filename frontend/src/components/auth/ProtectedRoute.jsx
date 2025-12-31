import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import useAuthStore from '../../store/useAuthStore';
import SkeletonLayout from '../layout/SkeletonLayout';

const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();
  const { user, isLoading } = useAuthStore();

  if (!isLoaded || isLoading) {
    return <SkeletonLayout />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Optional: If specific role required, check here (passed as prop?)
  // For now, just ensuring authentication.

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
