"use client";

import { useState } from "react";
import { 
  CheckCircle2,
  Circle,
  Upload,
  Bot,
  Code,
  ChevronRight,
  Check,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: string;
  href: string;
}

export function GettingStarted() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      id: 1,
      title: "Upload Your First VR Tour",
      description: "Get your venue's virtual tour uploaded and ready for visitors",
      icon: Upload,
      action: "Upload Tour",
      href: "/app/tours"
    },
    {
      id: 2, 
      title: "Configure Your AI Chatbot",
      description: "Set up your intelligent assistant to answer visitor questions",
      icon: Bot,
      action: "Setup Chatbot", 
      href: "/app/chatbots"
    },
    {
      id: 3,
      title: "Customise Your Settings",
      description: "Personalise your venue profile, branding, and contact details",
      icon: Code,
      action: "Edit Settings",
      href: "/app/settings"
    }
  ];

  const toggleStep = (stepId: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
              Getting Started
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Complete these steps to set up your venue's virtual experience
            </CardDescription>
          </div>
          <div className="flex-shrink-0">
            <div className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {completedSteps.length} of {steps.length} completed
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const Icon = step.icon;
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all duration-200",
                  isCompleted 
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                    : "bg-bg-secondary-light dark:bg-bg-secondary-dark border-border-light dark:border-border-dark hover:border-brand-blue/50"
                )}
              >
                <div className="flex-shrink-0 flex items-center">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 dark:border-gray-600 hover:border-brand-blue"
                    )}
                  >
                    {isCompleted && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                          isCompleted 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-brand-blue/10 text-brand-blue"
                        )}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={cn(
                            "text-sm sm:text-base font-medium",
                            isCompleted 
                              ? "text-green-800 dark:text-green-200 line-through" 
                              : "text-text-primary-light dark:text-text-primary-dark"
                          )}>
                            {step.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 sm:ml-4">
                      <Button
                        asChild
                        variant={isCompleted ? "outline" : "default"}
                        size="sm"
                        className="w-full sm:w-auto text-xs"
                        disabled={isCompleted}
                      >
                        <Link href={step.href}>
                          {isCompleted ? "Completed" : step.action}
                          {!isCompleted && <ArrowRight className="w-3 h-3 ml-1.5" />}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {completedSteps.length === steps.length && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-green-800 dark:text-green-200">
                  Congratulations! Setup Complete
                </h3>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-0.5">
                  Your venue's virtual experience is now ready for visitors
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 