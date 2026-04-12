"use client";

import Link from "next/link";
import { 
  Upload, 
  Bot, 
  Settings, 
  BarChart3,
  Plus,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    title: "Upload New Tour",
    icon: Upload,
    href: "/app/tours/new",
    iconBg: "bg-brand-blue/10 text-brand-blue"
  },
  {
    title: "Setup Chatbot",
    icon: Bot,
    href: "/app/chatbot",
    iconBg: "bg-ai-pink/10 text-ai-pink"
  },
  {
    title: "View Analytics",
    icon: BarChart3,
    href: "/app/analytics", 
    iconBg: "bg-success-green/10 text-success-green"
  },
  {
    title: "Venue settings",
    icon: Settings,
    href: "/app/settings",
    iconBg: "bg-warning-orange/10 text-warning-orange"
  }
];

const recentActivity = [
  {
    id: 1,
    title: "Account created",
    description: "Welcome to TourBots!",
    time: "Just now",
    icon: Plus,
    iconBg: "bg-success-green/10 text-success-green"
  },
  {
    id: 2, 
    title: "Venue profile setup",
    description: "Your venue information has been saved",
    time: "2 minutes ago",
    icon: Settings,
    iconBg: "bg-brand-blue/10 text-brand-blue"
  }
];

export function QuickActions() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <Button
                  key={index}
                  variant="ghost"
                  asChild
                  className="h-auto p-0 hover:bg-transparent"
                >
                  <Link href={action.href}>
                    <div className="flex items-center space-x-3 w-full p-3 rounded-lg border border-border-light dark:border-border-dark hover:border-brand-blue/30 hover:bg-bg-secondary-light dark:hover:bg-bg-secondary-dark transition-all duration-200">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", action.iconBg)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <span className="font-medium text-sm text-text-primary-light dark:text-text-primary-dark">
                        {action.title}
                      </span>
                      
                      <ArrowUpRight className="w-3 h-3 text-text-tertiary-light dark:text-text-tertiary-dark ml-auto" />
                    </div>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", activity.iconBg)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-text-primary-light dark:text-text-primary-dark">
                      {activity.title}
                    </h4>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {activity.description}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 