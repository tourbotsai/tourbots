"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Eye, 
  CreditCard,
  Bell,
  Globe,
  RefreshCw,
  AlertCircle,
  Clock
} from "lucide-react";
import { useDashboard } from "@/hooks/app/useDashboard";
import { ActivityItem } from "@/lib/dashboard-service";

interface RecentActivityProps {
  className?: string;
}

export function RecentActivity({ className }: RecentActivityProps) {
  const { data, loading, errors, refreshRecentActivity } = useDashboard();
  const activities = data.recentActivity;

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
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'conversation':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      case 'tour_view':
        return <Eye className="h-4 w-4 text-green-600" />;
      case 'subscription':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'conversation':
        const chatbotType = activity.metadata?.type;
        return (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            {chatbotType === 'tour' ? 'Tour Chat' : 'Website Chat'}
          </Badge>
        );
      case 'tour_view':
        return (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
            Tour View
          </Badge>
        );
      case 'subscription':
        const status = activity.metadata?.status;
        const variant = status === 'active' ? 'default' : 'secondary';
        return (
          <Badge variant={variant} className="text-xs">
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Activity
          </Badge>
        );
    }
  };

  if (loading.recentActivity) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest interactions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errors.recentActivity) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load activity</h3>
            <p className="text-muted-foreground mb-4">{errors.recentActivity}</p>
            <Button onClick={refreshRecentActivity} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest interactions and events</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Activity will appear here as visitors interact with your venue</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest interactions and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              {/* Activity Icon */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                {getActivityIcon(activity)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  {getActivityBadge(activity)}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>

                {/* Activity Metadata */}
                {activity.metadata && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {activity.metadata.domain && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>{activity.metadata.domain}</span>
                      </div>
                    )}
                    {activity.metadata.conversationId && (
                      <div>
                        ID: {activity.metadata.conversationId.slice(-8)}
                      </div>
                    )}
                    {activity.metadata.views && (
                      <div>
                        {activity.metadata.views} view{activity.metadata.views !== 1 ? 's' : ''}
                      </div>
                    )}
                    {activity.metadata.plan && (
                      <div className="capitalize">
                        {activity.metadata.plan} plan
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center mt-6">
          <Button 
            onClick={refreshRecentActivity} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 