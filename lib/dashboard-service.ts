// Shared types for the venue dashboard, consumed by hooks/app/useDashboard.ts.
// The actual data-fetching logic lives in app/api/app/dashboard/route.ts —
// this file only holds the response shape.

export interface DashboardOverview {
  totalTourViews: number;
  totalTourMoves: number;
  totalTourConversations: number;
  tourChatEngagementRate: number;
  uniqueDomains: number;
}

export interface QuickStats {
  viewsThisWeek: number;
  tourChatMessages: number;
  messageCreditsUsed: number;
  messageCreditsLimit: number;
  /** ISO timestamp for when the monthly message-credit allowance next refreshes. */
  messageCreditsResetAt?: string;
  botsUsed: number;
  botsLimit: number;
  uniqueDomains: number;
  totalLeads: number;
  avgResponseTime: number;
  subscriptionStatus: string;
  subscriptionDetails: {
    planName: string | null;
    currentPrice: number | null;
    billingCycle: string | null;
    isTrial: boolean;
    trialDaysRemaining: number | null;
    trialEndDate: string | null;
  } | null;
  venueInfoCompleteness: number;
  /** True when at least one tour chatbot config exists with is_active (matches Settings “Status: Active”). */
  hasActiveTourChatbot?: boolean;
  /** True when at least one active tour chatbot has customised Information Sections vs the default General Information template. */
  hasCustomisedTourTraining?: boolean;
  /** True after the venue has copied the simple iframe embed code (venues.pressed_share). */
  pressedShare?: boolean;
}

export interface RevenueMetrics {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  totalRevenue: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    invoices: number;
  }>;
  subscriptionBreakdown: Array<{
    plan: string;
    count: number;
    revenue: number;
  }>;
}

export interface VisitorAnalytics {
  totalTourViews: number;
  totalTourMoves: number;
  totalChatInteractions: number;
  dailyData: Array<{
    date: string;
    tourViews: number;
    tourMoves: number;
    chatMessages: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  topDomains: Array<{
    domain: string;
    views: number;
    conversations: number;
  }>;
}

export interface ActivityItem {
  id: string;
  type: 'conversation' | 'tour_view' | 'subscription' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface PerformanceMetrics {
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  popularTourSections: Array<{
    section: string;
    views: number;
  }>;
  chatbotEffectiveness: {
    totalQueries: number;
    resolvedQueries: number;
  };
}

/** Menu Analytics card — sourced from `embed_menu_events` (last 7 days), see sql/90_embed_menu_events.sql. */
export interface MenuAnalytics {
  /** Count of `menu_opened` events in the window. */
  opens: number;
  /** opens ÷ max(tourViewsThisWeek, 1), expressed as a percentage. */
  openRate: number;
  /** Most-clicked nav/button item labels (top 5). */
  topItems: Array<{
    label: string;
    count: number;
  }>;
  /** Breakdown of `menu_opened` events by chrome style. */
  styleBreakdown: Array<{
    style: string;
    count: number;
  }>;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'setup' | 'engagement' | 'billing' | 'content';
  actionUrl?: string;
  completed: boolean;
}
