import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from 'reactfire';
import { toast } from '@/components/ui/use-toast';
import { useUser } from './useUser';

export function useAuth() {
  const firebaseAuth = useFirebaseAuth();
  const router = useRouter();
  const { user, authUser, loading } = useUser();

  const logout = useCallback(async () => {
    try {
      // Sign out from Firebase
      await signOut(firebaseAuth);
      
      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cookies (if you use them)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
      // Redirect to home page
      router.push('/');
      
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
      
      // Force redirect even if signOut fails
      router.push('/');
    }
  }, [firebaseAuth, router]);

  const isAuthenticated = !loading && !!authUser && !!user;
  const isCompleteProfile = isAuthenticated && !!user?.venue;

  return {
    user,
    authUser,
    loading,
    isAuthenticated,
    isCompleteProfile,
    logout,
  };
} 