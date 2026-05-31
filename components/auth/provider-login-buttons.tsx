"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { FC, useState } from "react";
import { useAuth } from "reactfire";
import { useRouter } from "next/navigation";
import { clearUserCache } from "@/hooks/useUser";

interface Props {
  onSignIn?: () => void;
}

export const ProviderLoginButtons: FC<Props> = ({ onSignIn }) => {
  const auth = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding state for brand-new Google users. Google never supplies a
  // company name, which `/api/auth/register` requires to create the venue,
  // so we collect it before completing registration.
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [venueName, setVenueName] = useState("");

  const finishSignIn = () => {
    // Start the session from a clean cache so we never read a stale, pre-link
    // (venue-less) copy of this user.
    clearUserCache();
    if (onSignIn) {
      onSignIn();
    } else {
      router.push("/app/dashboard");
    }
    router.refresh();
  };

  const doProviderSignIn = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Authoritative check: does this user already have a TourBots profile
      // with a linked venue? `/api/auth/check-user` reads the Bearer token.
      const response = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (payload?.user?.venue) {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in with your Google account.",
          });
          finishSignIn();
          return;
        }
      }

      // No profile/venue yet: collect a company name to complete registration.
      const nameParts = (result.user.displayName || "").trim().split(/\s+/);
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setVenueName("");
      setPendingUser(result.user);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "An error occurred during sign in.";

      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign in was cancelled.";
      } else if (err.code === "auth/popup-blocked") {
        errorMessage = "Pop-up was blocked. Please allow pop-ups and try again.";
      }

      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async () => {
    if (!pendingUser) return;

    if (!firstName.trim() || !lastName.trim() || !venueName.trim()) {
      toast({
        title: "Missing details",
        description: "Please enter your name and company name to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const idToken = await pendingUser.getIdToken();

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          venue_name: venueName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to complete registration");
      }

      toast({
        title: "Account created!",
        description: "Welcome to TourBots AI! Upload your VR Tour to get started.",
      });
      setPendingUser(null);
      finishSignIn();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Registration Failed",
        description: err.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingUser) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-700/70 bg-slate-900/70 p-4">
        <p className="text-sm text-slate-300">
          Just one more step — confirm your details to finish setting up your account.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="First name"
            value={firstName}
            disabled={isLoading}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-slate-700/70 bg-slate-900/70 text-white placeholder-slate-500 focus-visible:border-brand-primary"
          />
          <Input
            placeholder="Last name"
            value={lastName}
            disabled={isLoading}
            onChange={(e) => setLastName(e.target.value)}
            className="border-slate-700/70 bg-slate-900/70 text-white placeholder-slate-500 focus-visible:border-brand-primary"
          />
        </div>
        <Input
          placeholder="Company name"
          value={venueName}
          disabled={isLoading}
          onChange={(e) => setVenueName(e.target.value)}
          className="border-slate-700/70 bg-slate-900/70 text-white placeholder-slate-500 focus-visible:border-brand-primary"
        />
        <Button
          disabled={isLoading}
          onClick={completeRegistration}
          size="lg"
          className="w-full bg-white font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-200"
        >
          {isLoading ? "Creating account..." : "Complete sign up"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        className="w-full border border-slate-700/70 bg-slate-900/70 text-white shadow-sm transition-colors duration-200 hover:bg-slate-800"
        disabled={isLoading}
        size="lg"
        onClick={doProviderSignIn}
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
