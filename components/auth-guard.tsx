"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  /** Require a complete venue profile (venue linked to the user). */
  requireVenue?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireVenue = false,
  redirectTo = '/login' 
}: AuthGuardProps) {
  const needsVenueProfile = requireVenue;
  const { user, authUser, loading, isAuthenticated, isCompleteProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still loading, don't redirect yet

    // If auth is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // If venue profile is required but not available
    if (needsVenueProfile && !isCompleteProfile) {
      router.push('/login?complete=true');
      return;
    }

  }, [isAuthenticated, isCompleteProfile, loading, requireAuth, needsVenueProfile, router, redirectTo]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, show nothing (redirect is happening)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If venue profile is required but not available, show nothing (redirect is happening)
  if (needsVenueProfile && !isCompleteProfile) {
    return null;
  }

  // All checks passed, render children
  return <>{children}</>;
} 