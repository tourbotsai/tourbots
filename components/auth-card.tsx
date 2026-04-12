"use client";

import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";

interface AuthCardProps {
  isShowingSignUp: boolean;
  setIsShowingSignUp: (value: boolean) => void;
}

export const AuthCard = ({ isShowingSignUp, setIsShowingSignUp }: AuthCardProps) => {
  const { authUser, user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated and has complete profile, redirect to dashboard
    if (authUser && user && user.venue) {
      router.push("/app/dashboard");
    }
  }, [authUser, user, router]);

  // If loading or user is already authenticated with complete profile, don't show auth card
  if (loading || (authUser && user && user.venue)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }
  
  return (
    <>
      <div className="max-w-lg mx-auto">
        <Card className="rounded-2xl border border-slate-700/70 bg-slate-900/50 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">
              {isShowingSignUp ? "Create your account" : "Sign in to your dashboard"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isShowingSignUp ? (
              <SignUpForm 
                onShowLogin={() => setIsShowingSignUp(false)} 
                onSignUp={() => router.push("/app/dashboard")}
              />
            ) : (
              <SignInForm 
                onShowSignUp={() => setIsShowingSignUp(true)} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
