'use client';

import * as React from "react";
import {
  Form,
  FormControl,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "reactfire";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ModalForgotPassword } from "@/components/auth/modal-forgot-password";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface SignInFormProps {
  onShowSignUp: () => void;
}

export const SignInForm: FC<SignInFormProps> = ({ onShowSignUp }) => {
  const auth = useAuth();
  const router = useRouter();
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async ({ email, password }: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your TourBots AI dashboard.",
      });
      router.push("/app/dashboard");
      router.refresh();
    } catch (error: any) {
      let errorMessage = "An error occurred during sign in.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(login)} className="space-y-3">
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
                      placeholder="Enter your password"
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
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 w-full bg-white font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-200"
            size="lg"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isLoading ? "Signing In..." : "Sign In to Dashboard"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-3 flex flex-col space-y-2 border-t border-slate-700/70 pt-3">
        <div className="text-center">
          <Button 
            variant="link" 
            onClick={() => setIsResetOpen(true)}
            className="h-auto p-0 font-normal text-brand-primary hover:text-brand-primary/80"
          >
            Forgot your password?
          </Button>
        </div>
        
        <div className="text-center text-sm text-slate-300">
          Don't have an account yet?{" "}
          <Button 
            variant="link" 
            onClick={onShowSignUp}
            className="h-auto p-0 font-medium text-brand-primary hover:text-brand-primary/80"
          >
            Create your account
          </Button>
        </div>
      </div>
      
      <ModalForgotPassword isOpen={isResetOpen} setIsOpen={setIsResetOpen} />
    </>
  );
};
