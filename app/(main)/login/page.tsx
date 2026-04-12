"use client";

import { AuthCard } from "@/components/auth-card";
import { ProviderLoginButtons } from "@/components/auth/provider-login-buttons";
import { OrSeparator } from "@/components/ui/or-separator";
import { useState } from "react";

export default function LoginPage() {
  const [isShowingSignUp, setIsShowingSignUp] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="container flex min-h-screen flex-col items-center justify-center py-10 md:py-14">
        <div className="w-full max-w-3xl space-y-7">
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {isShowingSignUp 
                ? "Create your TourBots AI account"
                : "Welcome back to TourBots AI"
              }
            </h1>
            <p className="mx-auto max-w-2xl text-slate-300 sm:text-lg">
              {isShowingSignUp 
                ? "Set up your account to manage AI virtual tour delivery across client accounts."
                : "Access your dashboard, account settings, and deployment tools."
              }
            </p>
          </div>

          <AuthCard isShowingSignUp={isShowingSignUp} setIsShowingSignUp={setIsShowingSignUp} />
          
          <div className="mx-auto max-w-lg space-y-3">
            <OrSeparator />
            <ProviderLoginButtons />
          </div>

          <div className="space-y-4 border-t border-slate-700/70 pt-6 text-center">
            <p className="text-sm text-slate-300">
              Need help accessing your account?
            </p>
            <div className="flex flex-col justify-center gap-4 text-sm sm:flex-row">
              <a 
                href="/contact" 
                className="font-medium text-brand-primary hover:underline"
              >
                Contact Support
              </a>
              <span className="hidden text-slate-500 sm:inline">|</span>
              <a 
                href="/demo" 
                className="font-medium text-brand-primary hover:underline"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
