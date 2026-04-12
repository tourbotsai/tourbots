"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  Users,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Database,
  Brain,
  CreditCard,
  Mail,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface PlatformHealthPanelProps {
  isLoading?: boolean;
}

interface ServiceStatus {
  status: 'healthy' | 'error' | 'unknown';
  responseTime: number;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'unknown';
  services: {
    database: ServiceStatus;
    openai: ServiceStatus;
    stripe: ServiceStatus;
    resend: ServiceStatus;
  };
  stats: {
    totalVenues: number;
    activeUsers: number;
    conversationsToday: number;
    activeSessions: number;
    activeVenuesThisMonth: number;
    monthlyRevenue: number;
  };
}

export function PlatformHealthPanel({ isLoading }: PlatformHealthPanelProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch health data from client-side
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setHealthData(data);
        }
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-ai-pink" />
            Platform Health
            <Badge variant="outline">Unavailable</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Unable to fetch health data
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success-green';
      case 'degraded':
        return 'text-warning-orange';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-success-green" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-warning-orange" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge className="bg-success-green/10 text-success-green border-success-green/20">
            Operational
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-warning-orange/10 text-warning-orange border-warning-orange/20">
            Degraded
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            Down
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  const formatRevenue = (value: number) => {
    return `£${value.toLocaleString('en-GB')}`;
  };

  const serviceItems = [
    {
      label: "Database",
      status: healthData.services.database.status,
      responseTime: healthData.services.database.responseTime,
      icon: <Database className="h-4 w-4" />,
    },
    {
      label: "OpenAI",
      status: healthData.services.openai.status,
      responseTime: healthData.services.openai.responseTime,
      icon: <Brain className="h-4 w-4" />,
    },
    {
      label: "Stripe",
      status: healthData.services.stripe.status,
      responseTime: healthData.services.stripe.responseTime,
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: "Email Service",
      status: healthData.services.resend.status,
      responseTime: healthData.services.resend.responseTime,
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  const platformStats = [
    {
      label: "Total venues",
      value: healthData.stats.totalVenues.toLocaleString(),
      icon: <Building2 className="h-4 w-4 text-brand-blue" />,
      description: "Registered venues",
    },
    {
      label: "Active Users",
      value: healthData.stats.activeUsers.toLocaleString(),
      icon: <Users className="h-4 w-4 text-success-green" />,
      description: "Platform users",
    },
    {
      label: "Conversations Today",
      value: healthData.stats.conversationsToday.toLocaleString(),
      icon: <MessageSquare className="h-4 w-4 text-purple-600" />,
      description: "AI chat sessions today",
    },
    {
      label: "Active Sessions",
      value: healthData.stats.activeSessions.toLocaleString(),
      icon: <Activity className="h-4 w-4 text-ai-pink" />,
      description: "Current sessions",
    },
    {
      label: "Active venues this month",
      value: healthData.stats.activeVenuesThisMonth.toLocaleString(),
      icon: <TrendingUp className="h-4 w-4 text-success-green" />,
      description: "Venues with activity",
    },
    {
      label: "Monthly Revenue",
      value: formatRevenue(healthData.stats.monthlyRevenue),
      icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
      description: "This month's revenue",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-ai-pink" />
          Platform Health
          {getStatusBadge(healthData.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Status */}
        <div>
          <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
            Service Status
          </h3>
          <div className="space-y-2">
            {serviceItems.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-secondary-light dark:hover:bg-bg-secondary-dark">
                <div className="flex items-center gap-3">
                  <div className={cn("p-1 rounded", getStatusColor(service.status))}>
                    {service.icon}
                  </div>
                  <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {service.label}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                    {service.responseTime}ms
                  </span>
                  {getStatusIcon(service.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Statistics */}
        <div>
          <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
            Platform Statistics
          </h3>
          <div className="space-y-2">
            {platformStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-secondary-light dark:hover:bg-bg-secondary-dark">
                <div className="flex items-center gap-3">
                  {stat.icon}
                  <div>
                    <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      {stat.label}
                    </div>
                    <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                      {stat.description}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 