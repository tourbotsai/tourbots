import React from "react";
import Link from "next/link";
import { 
  Camera, 
  Bot, 
  Settings, 
  BarChart3, 
  HelpCircle, 
  ExternalLink 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Commonly used features and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-auto p-4 sm:p-6 flex-col gap-2 sm:gap-3 hover:bg-brand-blue/5 hover:border-brand-blue/30 transition-all duration-200"
          >
            <Link href="/app/tours">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-2">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm sm:text-base">Upload Tour</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Add new VR tour
                </div>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-auto p-4 sm:p-6 flex-col gap-2 sm:gap-3 hover:bg-brand-blue/5 hover:border-brand-blue/30 transition-all duration-200"
          >
            <Link href="/app/chatbots">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-2">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm sm:text-base">AI Chatbot</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Configure assistant
                </div>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-auto p-4 sm:p-6 flex-col gap-2 sm:gap-3 hover:bg-brand-blue/5 hover:border-brand-blue/30 transition-all duration-200"
          >
            <Link href="/app/settings">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-2">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm sm:text-base">Settings</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Manage account
                </div>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-auto p-4 sm:p-6 flex-col gap-2 sm:gap-3 hover:bg-brand-blue/5 hover:border-brand-blue/30 transition-all duration-200"
          >
            <Link href="/app/analytics" className="pointer-events-none opacity-50">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm sm:text-base">Analytics</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Coming soon
                </div>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-auto p-4 sm:p-6 flex-col gap-2 sm:gap-3 hover:bg-brand-blue/5 hover:border-brand-blue/30 transition-all duration-200"
          >
            <Link href="/contact" target="_blank">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-2">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm sm:text-base">Get Help</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Contact support
                </div>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-auto p-4 sm:p-6 flex-col gap-2 sm:gap-3 hover:bg-brand-blue/5 hover:border-brand-blue/30 transition-all duration-200"
          >
            <Link href="/demo" target="_blank">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-2">
                <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm sm:text-base">View Demo</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  See example tour
                </div>
              </div>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 