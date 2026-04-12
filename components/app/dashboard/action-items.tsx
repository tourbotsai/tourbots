"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  TrendingUp,
  CreditCard,
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useDashboard } from "@/hooks/app/useDashboard";
import { ActionItem } from "@/lib/dashboard-service";
import Link from "next/link";

interface ActionItemsProps {
  className?: string;
}

export function ActionItems({ className }: ActionItemsProps) {
  const { data, loading, errors, refreshActionItems } = useDashboard();
  const actionItems = data.actionItems;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low Priority</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Priority</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'setup':
        return <Settings className="h-4 w-4" />;
      case 'engagement':
        return <TrendingUp className="h-4 w-4" />;
      case 'billing':
        return <CreditCard className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'setup':
        return 'text-blue-600';
      case 'engagement':
        return 'text-green-600';
      case 'billing':
        return 'text-purple-600';
      case 'content':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading.actionItems) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Action Items
          </CardTitle>
          <CardDescription>Recommended actions to improve your venue's performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errors.actionItems) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load action items</h3>
            <p className="text-muted-foreground mb-4">{errors.actionItems}</p>
            <Button onClick={refreshActionItems} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!actionItems || actionItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Action Items
          </CardTitle>
          <CardDescription>Recommended actions to improve your venue's performance</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
            <p className="font-medium text-green-600">All caught up!</p>
            <p className="text-sm">No action items at the moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group action items by priority
  const highPriorityItems = actionItems.filter(item => item.priority === 'high');
  const otherItems = actionItems.filter(item => item.priority !== 'high');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Action Items
        </CardTitle>
        <CardDescription>
          Recommended actions to improve your venue's performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* High Priority Items First */}
          {highPriorityItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Urgent Actions Required
              </div>
              {highPriorityItems.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Other Priority Items */}
          {otherItems.length > 0 && (
            <div className="space-y-3">
              {highPriorityItems.length > 0 && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    Additional Recommendations
                  </div>
                </div>
              )}
              {otherItems.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center mt-6">
          <Button 
            onClick={refreshActionItems} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh Items
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Individual Action Item Card Component
function ActionItemCard({ item }: { item: ActionItem }) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low Priority</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Priority</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'setup':
        return <Settings className="h-4 w-4" />;
      case 'engagement':
        return <TrendingUp className="h-4 w-4" />;
      case 'billing':
        return <CreditCard className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'setup':
        return 'text-blue-600';
      case 'engagement':
        return 'text-green-600';
      case 'billing':
        return 'text-purple-600';
      case 'content':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const priorityIcon = getPriorityIcon(item.priority);
  const priorityBadge = getPriorityBadge(item.priority);
  const typeIcon = getTypeIcon(item.type);
  const typeColor = getTypeColor(item.type);

  return (
    <div className={`p-4 border rounded-lg transition-all hover:shadow-sm ${
      item.priority === 'high' ? 'border-red-200 bg-red-50' : 
      item.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' : 
      'border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        {/* Priority & Type Icons */}
        <div className="flex flex-col gap-1">
          {priorityIcon}
          <div className={`${typeColor}`}>
            {typeIcon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm">{item.title}</h4>
            {priorityBadge}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {item.description}
          </p>

          {/* Action Button */}
          {item.actionUrl && (
            <Link href={item.actionUrl}>
              <Button 
                size="sm" 
                variant={item.priority === 'high' ? 'default' : 'outline'}
                className="text-xs"
              >
                Take Action
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 