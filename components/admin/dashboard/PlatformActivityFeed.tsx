"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  Building2,
  Upload,
  CreditCard,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { PlatformActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlatformActivityFeedProps {
  activities: PlatformActivity[];
  isLoading?: boolean;
}

export function PlatformActivityFeed({ activities, isLoading }: PlatformActivityFeedProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'venue_signup':
        return <Building2 className="h-4 w-4" />;
      case 'tour_upload':
        return <Upload className="h-4 w-4" />;
      case 'subscription_change':
        return <CreditCard className="h-4 w-4" />;
      case 'payment_received':
        return <CheckCircle className="h-4 w-4" />;
      case 'support_ticket':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'venue_signup':
        return 'text-success-green bg-success-green/10';
      case 'tour_upload':
        return 'text-brand-blue bg-brand-blue/10';
      case 'subscription_change':
        return 'text-ai-pink bg-ai-pink/10';
      case 'payment_received':
        return 'text-emerald-600 bg-emerald-600/10';
      case 'support_ticket':
        return 'text-warning-orange bg-warning-orange/10';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'venue_signup':
        return <Badge className="bg-success-green/10 text-success-green border-success-green/20 text-xs">New venue</Badge>;
      case 'tour_upload':
        return <Badge className="bg-brand-blue/10 text-brand-blue border-brand-blue/20 text-xs">Tour</Badge>;
      case 'subscription_change':
        return <Badge className="bg-ai-pink/10 text-ai-pink border-ai-pink/20 text-xs">Subscription</Badge>;
      case 'payment_received':
        return <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 text-xs">Payment</Badge>;
      case 'support_ticket':
        return <Badge className="bg-warning-orange/10 text-warning-orange border-warning-orange/20 text-xs">Support</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Activity</Badge>;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getActivityDetails = (activity: PlatformActivity) => {
    switch (activity.type) {
      case 'payment_received':
        return activity.metadata?.amount ? `£${activity.metadata.amount}` : null;
      case 'subscription_change':
        return activity.metadata?.plan ? activity.metadata.plan.charAt(0).toUpperCase() + activity.metadata.plan.slice(1) : null;
      default:
        return null;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-ai-pink" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center min-h-[480px]">
          <div className="text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              No recent activity to display
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-ai-pink" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-[480px]">
        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[580px] pr-2">
          {activities.slice(0, 20).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-bg-secondary-light dark:hover:bg-bg-secondary-dark transition-colors">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                getActivityColor(activity.type)
              )}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {activity.title}
                  </p>
                  {getActivityBadge(activity.type)}
                </div>
                
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  {activity.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                  
                  {activity.venueName && (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{activity.venueName}</span>
                    </div>
                  )}
                  
                  {getActivityDetails(activity) && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{getActivityDetails(activity)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {activities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark text-center flex-shrink-0">
            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
              Showing last {Math.min(activities.length, 20)} activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 