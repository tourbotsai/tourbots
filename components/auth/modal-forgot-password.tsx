import { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "reactfire";

interface ModalChangePasswordProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const ModalForgotPassword: FC<ModalChangePasswordProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const auth = useAuth();

  const onSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Reset Email Sent!",
        description: "Check your inbox for password reset instructions. Don't forget to check your spam folder.",
      });
      setIsOpen(false);
      setEmail(""); // Clear email after successful submission
    } catch (error: any) {
      let errorMessage = "An error occurred while sending the reset email.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      }
      
      toast({ 
        title: "Reset Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-neutral-900/80 backdrop-blur-md border-neutral-700/60 border">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl text-white">
              Reset Your Password
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Enter your email address and we'll send you a link to reset your password and get back into your TourBots dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label 
                htmlFor="email" 
                className="text-white"
              >
                Email Address
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                disabled={isLoading}
                name="email"
                type="email"
                placeholder="your.email@example.com"
                className="bg-neutral-800/80 border-neutral-700/60 text-white placeholder-gray-400 focus:border-brand-blue focus:ring-brand-blue"
                required
              />
            </div>

            <div className="bg-neutral-800/80 rounded-lg p-3">
              <p className="text-sm text-gray-300">
                💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                disabled={isLoading || !email.trim()} 
                onClick={() => onSubmit()}
                className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold transition-all duration-200 hover:scale-105"
                size="lg"
              >
                {isLoading ? "Sending Reset Email..." : "Send Reset Email"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="w-full bg-neutral-800/80 border-neutral-700/60 text-white hover:bg-neutral-700/80 hover:border-neutral-600/80 font-medium transition-all duration-200 hover:scale-105"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-neutral-700/60">
            <p className="text-xs text-gray-400">
              Still having trouble? Contact our support team at{" "}
              <a 
                href="mailto:support@tourbots.ai" 
                className="text-brand-blue hover:text-brand-blue/80"
              >
                support@tourbots.ai
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
