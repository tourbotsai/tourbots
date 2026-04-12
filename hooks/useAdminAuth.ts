import { useAuth } from './useAuth';

export function useAdminAuth() {
  const { user, authUser, loading, isAuthenticated } = useAuth();
  
  const isPlatformAdmin = isAuthenticated && user?.role === 'platform_admin';
  // Production-safe source of truth: authorise admin access by role only.
  const hasAdminAccess = isPlatformAdmin;
  
  return {
    user,
    authUser,
    loading,
    isAuthenticated,
    isPlatformAdmin,
    hasAdminAccess,
  };
} 