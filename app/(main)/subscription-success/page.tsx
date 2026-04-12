"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/app/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToDashboard = () => {
    router.push('/app/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-neutral-900/80 backdrop-blur-md border-neutral-700/60">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-success-green/10 rounded-full">
              <CheckCircle className="h-12 w-12 text-success-green" />
            </div>
          </div>
          <CardTitle className="text-3xl text-white mb-2">
            Payment Successful!
          </CardTitle>
          <Badge className="bg-success-green text-white">
            Subscription Activated
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">
              Welcome to TourBots AI! 🎉
            </h3>
            <p className="text-gray-300">
              Thank you for subscribing! Your payment has been processed successfully and your subscription is now active.
              You can now access all features including:
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-green flex-shrink-0" />
                <span className="text-sm text-gray-300">Virtual Tour Management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-green flex-shrink-0" />
                <span className="text-sm text-gray-300">AI-Powered Chatbots</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-green flex-shrink-0" />
                <span className="text-sm text-gray-300">Lead Management System</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-green flex-shrink-0" />
                <span className="text-sm text-gray-300">Advanced Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-green flex-shrink-0" />
                <span className="text-sm text-gray-300">Custom Branding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-green flex-shrink-0" />
                <span className="text-sm text-gray-300">Priority Support</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">What's Next?</h4>
            <p className="text-sm text-gray-300 mb-3">
              Head to your dashboard to start setting up your virtual tours and AI chatbots. 
              Our team will be in touch within 24 hours to help you get the most out of your subscription.
            </p>
            <div className="text-sm text-gray-400">
              Redirecting to dashboard in {countdown} seconds...
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoToDashboard}
              className="w-full bg-brand-blue hover:bg-brand-blue/90"
              size="lg"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/contact')}
              className="w-full text-gray-400 hover:text-white"
            >
              Need Help? Contact Support
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 pt-4 border-t border-neutral-700/60">
            <p>
              You'll receive a confirmation email shortly with your subscription details and next steps.
              If you have any questions, our support team is here to help.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 