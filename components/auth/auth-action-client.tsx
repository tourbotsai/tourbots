'use client';

import { useEffect, useState, FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode, applyActionCode } from "firebase/auth";
import { useAuth } from "reactfire";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ActionMode = 'resetPassword' | 'verifyEmail' | 'recoverEmail' | null;

export const AuthActionClient: FC = () => {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mode, setMode] = useState<ActionMode>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const actionMode = searchParams.get('mode') as ActionMode;
    const actionCode = searchParams.get('oobCode');
    
    if (!actionCode) {
      setError('Invalid or missing action code.');
      setLoading(false);
      return;
    }

    setMode(actionMode);
    setOobCode(actionCode);

    // Verify the action code and get email for password reset
    if (actionMode === 'resetPassword') {
      verifyPasswordResetCode(auth, actionCode)
        .then((email) => {
          setEmail(email);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error verifying reset code:', error);
          let errorMessage = 'Invalid or expired reset link.';
          
          if (error.code === 'auth/expired-action-code') {
            errorMessage = 'This password reset link has expired. Please request a new one.';
          } else if (error.code === 'auth/invalid-action-code') {
            errorMessage = 'This password reset link is invalid. Please request a new one.';
          } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This user account has been disabled.';
          }
          
          setError(errorMessage);
          setLoading(false);
        });
    } else if (actionMode === 'verifyEmail') {
      // Handle email verification
      applyActionCode(auth, actionCode)
        .then(() => {
          setSuccess(true);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error verifying email:', error);
          setError('Failed to verify email. The link may be invalid or expired.');
          setLoading(false);
        });
    } else {
      setError('Unsupported action type.');
      setLoading(false);
    }
  }, [auth, searchParams]);

  const handlePasswordReset = async () => {
    if (!oobCode) return;

    // Validate passwords
    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Password validation failed';
      setError(errorMessage);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/expired-action-code') {
        errorMessage = 'This reset link has expired. Please request a new password reset.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'This reset link is invalid. Please request a new password reset.';
      }
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-neutral-900/80 backdrop-blur-md border-neutral-700/60">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
              <p className="text-gray-300">Verifying action link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800">
      <div className="container flex flex-col items-center justify-center min-h-screen py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/tourbots/tourbots_icon_hd.png"
                alt="TourBots"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
          </div>

          <Card className="bg-neutral-900/80 backdrop-blur-md border-neutral-700/60">
            <CardHeader className="text-center space-y-2">
              {mode === 'resetPassword' && !success && (
                <>
                  <CardTitle className="text-xl text-white">
                    Reset Your Password
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Enter your new password below
                  </CardDescription>
                </>
              )}
              
              {mode === 'verifyEmail' && success && (
                <>
                  <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Email Verified
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Your email address has been successfully verified
                  </CardDescription>
                </>
              )}
              
              {success && mode === 'resetPassword' && (
                <>
                  <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Password Reset Complete
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Your password has been successfully updated
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {mode === 'resetPassword' && !success && !error && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-neutral-800/80 border-neutral-700/60 text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="bg-neutral-800/80 border-neutral-700/60 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-brand-blue pr-10"
                        disabled={processing}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="bg-neutral-800/80 border-neutral-700/60 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-brand-blue pr-10"
                        disabled={processing}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordReset}
                    disabled={processing || !password || !confirmPassword}
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold transition-all duration-200 hover:scale-105"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </>
              )}

              {success && (
                <>
                  <div className="text-center py-4">
                    <p className="text-gray-300 mb-4">
                      {mode === 'resetPassword' 
                        ? 'You will be redirected to the login page shortly.'
                        : 'You can now close this window.'
                      }
                    </p>
                    
                    {mode === 'resetPassword' && (
                      <Link href="/login">
                        <Button 
                          className="bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold transition-all duration-200 hover:scale-105"
                          size="lg"
                        >
                          Go to Login
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              )}

              {error && (
                <div className="text-center pt-4">
                  <Link href="/login">
                    <Button 
                      variant="outline"
                      className="bg-neutral-800/80 border-neutral-700/60 text-white hover:bg-neutral-700/80 transition-all duration-200 hover:scale-105"
                    >
                      Back to Login
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support contact - matching your login page pattern */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Having trouble? Contact our support team at{" "}
              <a 
                href="mailto:support@tourbots.ai" 
                className="text-brand-blue hover:text-brand-blue/80"
              >
                support@tourbots.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 