'use client';

import * as React from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FC, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "reactfire";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Building } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  venueName: z.string().min(2, "Company name is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface SignUpFormProps {
  onShowLogin: () => void;
  onSignUp?: () => void;
}

export const SignUpForm: FC<SignUpFormProps> = ({ onShowLogin, onSignUp }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      venueName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const auth = useAuth();

  const signup = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      if (userCredential.user) {
        const idToken = await userCredential.user.getIdToken();

        // Create user and venue in Supabase
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName,
            venue_name: data.venueName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to complete registration');
        }

        toast({ 
          title: "Registration Successful!", 
          description: "Welcome to TourBots AI! Upload your VR Tour to get started."
        });
        
        // Redirect to app where billing guard will handle subscription selection
        onSignUp?.();
      }
    } catch (error: any) {
      let errorMessage = "An error occurred during registration.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Registration Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(signup)}>
          <fieldset disabled={isLoading} className="space-y-2.5">
            <FormField
              control={form.control}
              name="venueName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Company name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Example Agency Ltd"
                        className="border-slate-700/70 bg-slate-900/70 pl-10 text-white placeholder-slate-500 focus-visible:border-brand-primary"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-2.5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="John"
                          className="border-slate-700/70 bg-slate-900/70 pl-10 text-white placeholder-slate-500 focus-visible:border-brand-primary"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="Smith"
                          className="border-slate-700/70 bg-slate-900/70 pl-10 text-white placeholder-slate-500 focus-visible:border-brand-primary"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        type="email" 
                        placeholder="your.email@example.com"
                        className="border-slate-700/70 bg-slate-900/70 pl-10 text-white placeholder-slate-500 focus-visible:border-brand-primary"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        className="border-slate-700/70 bg-slate-900/70 pl-10 pr-10 text-white placeholder-slate-500 focus-visible:border-brand-primary"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-slate-400">
                    Must be at least 8 characters long
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="border-slate-700/70 bg-slate-900/70 pl-10 pr-10 text-white placeholder-slate-500 focus-visible:border-brand-primary"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit"
              className="mt-4 w-full bg-white font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-200"
              size="lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isLoading ? "Creating Account..." : "Create Your Account"}
            </Button>
          </fieldset>
        </form>
      </Form>

      <div className="mt-3 border-t border-slate-700/70 pt-3 text-center">
        <p className="text-sm text-slate-300">
          Already have an account?{" "}
          <Button 
            variant="link" 
            onClick={onShowLogin}
            className="h-auto p-0 font-medium text-brand-primary hover:text-brand-primary/80"
          >
            Sign in here
          </Button>
        </p>
      </div>

      <div className="text-center mt-2">
        <p className="text-xs text-slate-400">
          By creating an account, you agree to our{" "}
          <a 
            href="/legal?section=terms" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 transition-colors hover:text-brand-primary hover:underline"
          >
            terms of service
          </a>
          {" "}and{" "}
          <a 
            href="/legal?section=privacy" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 transition-colors hover:text-brand-primary hover:underline"
          >
            privacy policy
          </a>
        </p>
      </div>
    </>
  );
};
