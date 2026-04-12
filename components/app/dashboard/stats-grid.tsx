"use client";

import { 
  Building, 
  Users, 
  BarChart3, 
  Eye,
  Target,
  Zap,
  Clock,
  TrendingUp,
  ArrowUpIcon,
  ArrowDownIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

function StatCard({ title, value, description, icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              {title}
            </p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mt-1">
              {value}
            </p>
            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mt-1">
              {description}
            </p>
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColor)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsGrid() {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Tours"
        value="12"
        change="+2.1%"
        trend="up"
        icon={<Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
      />
      <StatsCard
        title="Total Views"
        value="2,847"
        change="+12.3%"
        trend="up"
        icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
      />
      <StatsCard
        title="Avg. Session"
        value="3m 24s"
        change="-0.5%"
        trend="down"
        icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
      />
      <StatsCard
        title="Conversion"
        value="4.8%"
        change="+1.2%"
        trend="up"
        icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
      />
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

function StatsCard({ title, value, change, trend, icon }: StatsCardProps) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mt-1">
            {value}
          </p>
        </div>
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
          <div className="text-brand-blue">
            {icon}
          </div>
        </div>
      </div>
      <div className="mt-3 sm:mt-4 flex items-center">
        <div className={cn(
          "inline-flex items-center text-xs sm:text-sm font-medium",
          trend === 'up' ? "text-green-600" : "text-red-600"
        )}>
          {trend === 'up' ? (
            <ArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          ) : (
            <ArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          )}
          {change}
        </div>
        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ml-2">
          from last month
        </span>
      </div>
    </Card>
  );
} 