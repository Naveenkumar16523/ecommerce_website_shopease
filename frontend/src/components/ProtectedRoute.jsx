import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase mt-6 animate-pulse">ShopEase Loading...</h2>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login, saving current location
    const redirectUrl = adminOnly ? '/admin-login' : '/login';
    return <Navigate to={`${redirectUrl}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (adminOnly && user.is_admin !== 1) {
    // If trying to access admin dashboard, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
}
