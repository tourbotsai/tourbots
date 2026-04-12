"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { FC, useState } from "react";
import { useAuth } from "reactfire";

interface Props {
  onSignIn?: () => void;
}

export const ProviderLoginButtons: FC<Props> = ({ onSignIn }) => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const doProviderSignIn = async (provider: GoogleAuthProvider) => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Check if this is a new user or existing user
        const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
        
        if (isNewUser) {
          // For new Google users, they need to complete registration details
          toast({ 
            title: "Almost there!", 
            description: "Please complete your account registration to continue.",
            variant: "default"
          });
          // You might want to redirect to a completion form here
          return;
        } else {
          // Existing user - check if they exist in Supabase
          const response = await fetch('/api/auth/check-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebase_uid: result.user.uid,
            }),
          });

          if (!response.ok) {
            // User exists in Firebase but not in Supabase - need to complete registration
            toast({ 
              title: "Complete Your Registration", 
              description: "Please fill in your account details to continue.",
              variant: "default"
            });
            return;
          }
        }
      }
      
      toast({ 
        title: "Welcome back!", 
        description: "Successfully signed in with your Google account."
      });
      onSignIn?.();
    } catch (err: any) {
      console.error(err);
      let errorMessage = "An error occurred during sign in.";
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign in was cancelled.";
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked. Please allow pop-ups and try again.";
      }
      
      toast({ 
        title: "Sign In Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-3">
      <Button
        className="w-full border border-slate-700/70 bg-slate-900/70 text-white shadow-sm transition-colors duration-200 hover:bg-slate-800"
        disabled={isLoading}
        size="lg"
        onClick={async () => {
          const provider = new GoogleAuthProvider();
          await doProviderSignIn(provider);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1em"
          viewBox="0 0 488 512"
          fill="currentColor"
          className="mr-3 w-5 h-5"
        >
          <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
        </svg>
        {isLoading ? "Signing in..." : "Continue with Google"}
      </Button>
    </div>
  );
};
