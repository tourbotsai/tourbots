"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AdminGuard({ 
  children, 
  redirectTo = '/app/dashboard' 
}: AdminGuardProps) {
  const { hasAdminAccess, loading, isAuthenticated } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still loading, don't redirect yet

    // If not authenticated at all, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If authenticated but no admin access, redirect to user dashboard
    if (!hasAdminAccess) {
      router.push(redirectTo);
      return;
    }

  }, [hasAdminAccess, isAuthenticated, loading, router, redirectTo]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ai-pink"></div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  // If no admin access, show nothing (redirect is happening)
  if (!hasAdminAccess) {
    return null;
  }

  // All checks passed, render children
  return <>{children}</>;
} 