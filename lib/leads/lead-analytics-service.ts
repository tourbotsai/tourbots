import { supabase } from '../supabase';
import { Lead, LeadAnalytics, LeadDashboardData } from '../types';
import { LEAD_PERFORMANCE_THRESHOLDS } from '../constants/lead-constants';
import { getLeadScoringInsights } from './lead-scoring';

export interface LeadMetrics {
  totalLeads: number;
  newLeads: number;
  leadsThisMonth: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageLeadScore: number;
  avgLeadScore: number;
  leadGrowth: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  };
}

export interface LeadSourceAnalytics {
  tour: {
    leads: number;
    count: number;
    percentage: number;
    conversionRate: number;
  };
}

export interface LeadTimeSeriesData {
  date: string;
  leads: number;
  conversions: number;
  score: number;
}

export interface LeadPerformanceInsights {
  topPerformingTriggers: Array<{ trigger: string; leads: number; rate: number }>;
  bestConvertingInterests: Array<{ interest: string; conversions: number; rate: number }>;
  optimalCaptureTime: { hour: number; leads: number };
  seasonalTrends: Array<{ period: string; leads: number; change: number }>;
}

// Get comprehensive lead metrics for a venue
export async function getLeadMetrics(venueId: string, days: number = 30): Promise<LeadMetrics> {
  try {
    console.log('Fetching lead metrics for venue:', venueId, 'for last', days, 'days');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Get ALL leads for total count (not time-filtered)
    const { data: allLeads, error: allLeadsError } = await supabase
      .from('leads')
      .select('lead_status, interest_level, lead_score, created_at')
      .eq('venue_id', venueId);

    if (allLeadsError) {
      console.error('Error fetching all leads:', allLeadsError);
      throw allLeadsError;
    }

    // Current period leads (for time-based metrics)
    const { data: currentLeads, error: currentError } = await supabase
      .from('leads')
      .select('lead_status, interest_level, lead_score, created_at')
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (currentError) {
      console.error('Error fetching current leads:', currentError);
      throw currentError;
    }

    // Get leads from this month specifically
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const { data: thisMonthLeads, error: monthError } = await supabase
      .from('leads')
      .select('id')
      .eq('venue_id', venueId)
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', endDate.toISOString());

    if (monthError) {
      console.error('Error fetching this month leads:', monthError);
      throw monthError;
    }

    // Previous period leads for growth calculation
    const { data: previousLeads, error: previousError } = await supabase
      .from('leads')
      .select('id')
      .eq('venue_id', venueId)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    if (previousError) {
      console.error('Error fetching previous leads:', previousError);
      throw previousError;
    }

    // Calculate metrics - use all leads for total count, current period for rates
    const totalLeads = allLeads?.length || 0; // All-time total
    const newLeads = currentLeads?.filter(lead => lead.lead_status === 'new').length || 0;
    const leadsThisMonth = thisMonthLeads?.length || 0;
    const qualifiedLeads = currentLeads?.filter(lead => 
      ['contacted', 'qualified'].includes(lead.lead_status)
    ).length || 0;
    const convertedLeads = currentLeads?.filter(lead => lead.lead_status === 'converted').length || 0;

    // Use all leads for conversion rate calculation to match the total
    const allConvertedLeads = allLeads?.filter(lead => lead.lead_status === 'converted').length || 0;
    const conversionRate = totalLeads > 0 ? (allConvertedLeads / totalLeads) * 100 : 0;

    // Use all leads for average score to be more representative
    const averageLeadScore = allLeads && allLeads.length > 0
      ? allLeads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / allLeads.length
      : 0;

    const previousTotal = previousLeads?.length || 0;
    const leadGrowth = previousTotal > 0 
      ? ((totalLeads - previousTotal) / previousTotal) * 100 
      : totalLeads > 0 ? 100 : 0;

    const metrics: LeadMetrics = {
      totalLeads,
      newLeads,
      leadsThisMonth,
      qualifiedLeads,
      convertedLeads,
      conversionRate: Number(conversionRate.toFixed(2)),
      averageLeadScore: Number(averageLeadScore.toFixed(1)),
      avgLeadScore: Number(averageLeadScore.toFixed(1)),
      leadGrowth: Number(leadGrowth.toFixed(1)),
      leadsByStatus: {
        new: allLeads?.filter(lead => lead.lead_status === 'new').length || 0,
        contacted: allLeads?.filter(lead => lead.lead_status === 'contacted').length || 0,
        qualified: allLeads?.filter(lead => lead.lead_status === 'qualified').length || 0,
        converted: allLeads?.filter(lead => lead.lead_status === 'converted').length || 0
      }
    };

    console.log('Lead metrics calculated:', metrics);
    return metrics;
  } catch (error) {
    console.error('Error in getLeadMetrics:', error);
    throw error;
  }
}

// Get lead source analytics (tour chatbot only; all captured leads attributed to tour)
export async function getLeadSourceAnalytics(venueId: string, days: number = 30): Promise<LeadSourceAnalytics> {
  try {
    console.log('Fetching lead source analytics for venue:', venueId);

    // Get ALL leads for source analytics (not time-filtered) to match the metrics approach
    const { data: leads, error } = await supabase
      .from('leads')
      .select('lead_status')
      .eq('venue_id', venueId);

    if (error) {
      console.error('Error fetching lead source data:', error);
      throw error;
    }

    const totalLeads = leads?.length || 0;
    const tourConversions = leads?.filter(lead => lead.lead_status === 'converted').length || 0;

    const analytics: LeadSourceAnalytics = {
      tour: {
        leads: totalLeads,
        count: totalLeads,
        percentage: totalLeads > 0 ? 100 : 0,
        conversionRate: totalLeads > 0 ? Number(((tourConversions / totalLeads) * 100).toFixed(1)) : 0
      }
    };

    console.log('Lead source analytics calculated:', analytics);
    return analytics;
  } catch (error) {
    console.error('Error in getLeadSourceAnalytics:', error);
    throw error;
  }
}

// Get time series data for lead trends
export async function getLeadTimeSeriesData(venueId: string, days: number = 30): Promise<LeadTimeSeriesData[]> {
  try {
    console.log('Fetching lead time series data for venue:', venueId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: leads, error } = await supabase
      .from('leads')
      .select('created_at, lead_status, lead_score')
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching lead time series data:', error);
      throw error;
    }

    // Group leads by date
    const dailyData: Record<string, { leads: number; conversions: number; totalScore: number; count: number }> = {};

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { leads: 0, conversions: 0, totalScore: 0, count: 0 };
    }

    // Count leads and conversions by date
    leads?.forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      if (dailyData[date]) {
        dailyData[date].leads++;
        dailyData[date].totalScore += lead.lead_score || 0;
        dailyData[date].count++;
        if (lead.lead_status === 'converted') {
          dailyData[date].conversions++;
        }
      }
    });

    // Convert to array format
    const timeSeriesData: LeadTimeSeriesData[] = Object.entries(dailyData).map(([date, data]) => ({
      date,
      leads: data.leads,
      conversions: data.conversions,
      score: data.count > 0 ? Number((data.totalScore / data.count).toFixed(1)) : 0
    }));

    console.log(`Generated ${timeSeriesData.length} days of time series data`);
    return timeSeriesData;
  } catch (error) {
    console.error('Error in getLeadTimeSeriesData:', error);
    throw error;
  }
}

// Get lead performance insights
export async function getLeadPerformanceInsights(venueId: string, days: number = 90): Promise<LeadPerformanceInsights> {
  try {
    console.log('Fetching lead performance insights for venue:', venueId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: leads, error } = await supabase
      .from('leads')
      .select('interests, lead_status, created_at, conversation_context')
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching leads for insights:', error);
      throw error;
    }

    // Analyse interests and conversions
    const interestStats: Record<string, { total: number; conversions: number }> = {};
    const hourlyStats: Record<number, number> = {};

    leads?.forEach(lead => {
      // Track interests
      const interests = lead.interests || [];
      interests.forEach((interest: string) => {
        if (!interestStats[interest]) {
          interestStats[interest] = { total: 0, conversions: 0 };
        }
        interestStats[interest].total++;
        if (lead.lead_status === 'converted') {
          interestStats[interest].conversions++;
        }
      });

      // Track hourly patterns
      const hour = new Date(lead.created_at).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    // Find best converting interests
    const bestConvertingInterests = Object.entries(interestStats)
      .filter(([_, stats]) => stats.total >= 2) // Minimum 2 leads (lowered threshold)
      .map(([interest, stats]) => ({
        interest,
        conversions: stats.conversions,
        rate: Number(((stats.conversions / stats.total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);

    // Find optimal capture time
    const optimalHour = Object.entries(hourlyStats)
      .sort(([, a], [, b]) => b - a)[0];

    const optimalCaptureTime = optimalHour 
      ? { hour: parseInt(optimalHour[0]), leads: optimalHour[1] }
      : { hour: 14, leads: 0 }; // Default to 2 PM

    // Remove mock data - calculate real triggers from conversation context
    const topPerformingTriggers: Array<{ trigger: string; leads: number; rate: number }> = [];
    
    // Analyse conversation context for common triggers if available
    if (leads && leads.length > 0) {
      const triggerStats: Record<string, number> = {};
      
      leads.forEach(lead => {
        // Simple analysis of conversation context for common keywords
        const context = lead.conversation_context;
        if (context && typeof context === 'string') {
          const lowerContext = context.toLowerCase();
          if (lowerContext.includes('price') || lowerContext.includes('cost') || lowerContext.includes('membership')) {
            triggerStats['pricing_questions'] = (triggerStats['pricing_questions'] || 0) + 1;
          }
          if (lowerContext.includes('tour') || lowerContext.includes('visit')) {
            triggerStats['tour_requests'] = (triggerStats['tour_requests'] || 0) + 1;
          }
          if (lowerContext.includes('class') || lowerContext.includes('training')) {
            triggerStats['class_inquiries'] = (triggerStats['class_inquiries'] || 0) + 1;
          }
          if (lowerContext.includes('equipment') || lowerContext.includes('facilities')) {
            triggerStats['facility_questions'] = (triggerStats['facility_questions'] || 0) + 1;
          }
        }
      });

      // Convert to expected format
      Object.entries(triggerStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .forEach(([trigger, count]) => {
          topPerformingTriggers.push({
            trigger: trigger.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            leads: count,
            rate: leads.length > 0 ? Number(((count / leads.length) * 100).toFixed(1)) : 0
          });
        });
    }

    // Calculate real seasonal trends
    const currentMonth = new Date().getMonth();
    const currentMonthLeads = leads?.filter(lead => 
      new Date(lead.created_at).getMonth() === currentMonth
    ).length || 0;
    
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthLeads = leads?.filter(lead => 
      new Date(lead.created_at).getMonth() === previousMonth
    ).length || 0;

    const seasonalTrends = [
      { 
        period: 'Current Month', 
        leads: currentMonthLeads, 
        change: previousMonthLeads > 0 ? 
          Number(((currentMonthLeads - previousMonthLeads) / previousMonthLeads * 100).toFixed(1)) : 
          (currentMonthLeads > 0 ? 100 : 0)
      },
      { 
        period: 'Previous Month', 
        leads: previousMonthLeads, 
        change: 0 // Base comparison
      }
    ];

    const insights: LeadPerformanceInsights = {
      topPerformingTriggers,
      bestConvertingInterests,
      optimalCaptureTime,
      seasonalTrends
    };

    console.log('Lead performance insights calculated:', insights);
    return insights;
  } catch (error) {
    console.error('Error in getLeadPerformanceInsights:', error);
    throw error;
  }
}

// Get lead funnel analytics
export async function getLeadFunnelAnalytics(venueId: string, days: number = 30): Promise<{
  chatSessions: number;
  leadsGenerated: number;
  contacted: number;
  qualified: number;
  converted: number;
  conversionRates: {
    sessionToLead: number;
    leadToContact: number;
    contactToQualified: number;
    qualifiedToConversion: number;
  };
}> {
  try {
    console.log('Fetching lead funnel analytics for venue:', venueId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all leads for the period
    const { data: leads, error } = await supabase
      .from('leads')
      .select('lead_status, conversation_context')
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching leads for funnel:', error);
      throw error;
    }

    const totalLeads = leads?.length || 0;
    
    // Count leads by status
    const statusCounts = {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0
    };

    leads?.forEach(lead => {
      if (lead.lead_status in statusCounts) {
        statusCounts[lead.lead_status as keyof typeof statusCounts]++;
      }
    });

    // Estimate chat sessions - assume each lead represents a chat session
    // In a real implementation, you'd track this separately
    const chatSessions = totalLeads > 0 ? Math.max(totalLeads, Math.floor(totalLeads * 1.2)) : 0;
    
    const leadsGenerated = totalLeads;
    const contacted = statusCounts.contacted + statusCounts.qualified + statusCounts.converted;
    const qualified = statusCounts.qualified + statusCounts.converted;
    const converted = statusCounts.converted;

    // Calculate conversion rates
    const sessionToLead = chatSessions > 0 ? Number(((leadsGenerated / chatSessions) * 100).toFixed(1)) : 0;
    const leadToContact = leadsGenerated > 0 ? Number(((contacted / leadsGenerated) * 100).toFixed(1)) : 0;
    const contactToQualified = contacted > 0 ? Number(((qualified / contacted) * 100).toFixed(1)) : 0;
    const qualifiedToConversion = qualified > 0 ? Number(((converted / qualified) * 100).toFixed(1)) : 0;

    const analytics = {
      chatSessions,
      leadsGenerated,
      contacted,
      qualified,
      converted,
      conversionRates: {
        sessionToLead,
        leadToContact,
        contactToQualified,
        qualifiedToConversion
      }
    };

    console.log('Lead funnel analytics calculated:', analytics);
    return analytics;
  } catch (error) {
    console.error('Error in getLeadFunnelAnalytics:', error);
    throw error;
  }
}

// Convert performance insights to dashboard insights format
function convertPerformanceInsightsToDashboardInsights(insights: LeadPerformanceInsights, metrics: any): Array<{
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  value?: string;
}> {
  const dashboardInsights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    value?: string;
  }> = [];

  // Conversion rate insights
  if (metrics.conversionRate > LEAD_PERFORMANCE_THRESHOLDS.CONVERSION_RATE.EXCELLENT) {
    dashboardInsights.push({
      type: 'positive',
      title: 'Strong Conversion Performance',
      description: `Your conversion rate of ${metrics.conversionRate}% is excellent, well above the industry average of 10-15%.`,
      value: `${metrics.conversionRate}%`
    });
  } else if (metrics.conversionRate < LEAD_PERFORMANCE_THRESHOLDS.CONVERSION_RATE.POOR) {
    dashboardInsights.push({
      type: 'negative',
      title: 'Low Conversion Rate',
      description: `Your conversion rate of ${metrics.conversionRate}% could be improved. Consider reviewing your follow-up process.`,
      value: `${metrics.conversionRate}%`
    });
  }

  // Lead growth insights
  if (metrics.leadGrowthRate > LEAD_PERFORMANCE_THRESHOLDS.LEAD_GROWTH.STRONG) {
    dashboardInsights.push({
      type: 'positive',
      title: 'Strong Lead Growth',
      description: `Lead generation has grown by ${metrics.leadGrowthRate}% this period. Keep up the excellent work!`,
      value: `+${metrics.leadGrowthRate}%`
    });
  } else if (metrics.leadGrowthRate < LEAD_PERFORMANCE_THRESHOLDS.LEAD_GROWTH.DECLINING) {
    dashboardInsights.push({
      type: 'negative',
      title: 'Declining Lead Generation',
      description: `Lead generation has decreased by ${Math.abs(metrics.leadGrowthRate)}%. Consider reviewing your chatbot engagement strategies.`,
      value: `${metrics.leadGrowthRate}%`
    });
  }

  // Lead score insights
  if (metrics.avgLeadScore > LEAD_PERFORMANCE_THRESHOLDS.LEAD_SCORE_RATING.EXCELLENT) {
    dashboardInsights.push({
      type: 'positive',
      title: 'High Quality Leads',
      description: `Your average lead score of ${metrics.avgLeadScore} indicates excellent lead quality.`,
      value: `${metrics.avgLeadScore}/100`
    });
  } else if (metrics.avgLeadScore < LEAD_PERFORMANCE_THRESHOLDS.LEAD_SCORE_RATING.FAIR) {
    dashboardInsights.push({
      type: 'negative',
      title: 'Lead Quality Concerns',
      description: `Average lead score of ${metrics.avgLeadScore} suggests room for improvement in lead qualification.`,
      value: `${metrics.avgLeadScore}/100`
    });
  }

  // Optimal capture time insights
  if (insights.optimalCaptureTime.leads > 0) {
    const hour = insights.optimalCaptureTime.hour;
    const timeStr = hour === 0 ? '12 AM' : 
                   hour < 12 ? `${hour} AM` : 
                   hour === 12 ? '12 PM' : 
                   `${hour - 12} PM`;
    
    dashboardInsights.push({
      type: 'neutral',
      title: 'Peak Engagement Time',
      description: `Most leads are captured around ${timeStr}. Consider scheduling content or follow-ups during this time.`,
      value: timeStr
    });
  }

  // Best converting interests insights
  if (insights.bestConvertingInterests.length > 0) {
    const topInterest = insights.bestConvertingInterests[0];
    if (topInterest.rate > LEAD_PERFORMANCE_THRESHOLDS.INSIGHTS.HIGH_CONVERTING_INTEREST) {
      dashboardInsights.push({
        type: 'positive',
        title: 'High-Converting Interest Identified',
        description: `Leads interested in "${topInterest.interest}" convert at ${topInterest.rate}%. Focus marketing efforts here.`,
        value: `${topInterest.rate}%`
      });
    }
  }

  // Top performing triggers insights
  if (insights.topPerformingTriggers.length > 0) {
    const topTrigger = insights.topPerformingTriggers[0];
    dashboardInsights.push({
      type: 'neutral',
      title: 'Top Performing Trigger',
      description: `"${topTrigger.trigger}" generates the most leads (${topTrigger.leads}). Consider optimising this trigger further.`,
      value: `${topTrigger.leads} leads`
    });
  }

  // Follow-up rate insights
  if (metrics.followUpRate > LEAD_PERFORMANCE_THRESHOLDS.FOLLOW_UP_RATE.EXCELLENT) {
    dashboardInsights.push({
      type: 'positive',
      title: 'Excellent Follow-Up Rate',
      description: `${metrics.followUpRate}% of leads are being followed up with. Great engagement management!`,
      value: `${metrics.followUpRate}%`
    });
  } else if (metrics.followUpRate < LEAD_PERFORMANCE_THRESHOLDS.FOLLOW_UP_RATE.FAIR) {
    dashboardInsights.push({
      type: 'negative',
      title: 'Low Follow-Up Rate',
      description: `Only ${metrics.followUpRate}% of leads are being followed up with. Many opportunities may be lost.`,
      value: `${metrics.followUpRate}%`
    });
  }

  // Seasonal trends insights
  if (insights.seasonalTrends.length > 0) {
    const currentTrend = insights.seasonalTrends[0];
    if (currentTrend.change > LEAD_PERFORMANCE_THRESHOLDS.INSIGHTS.STRONG_MONTHLY_CHANGE) {
      dashboardInsights.push({
        type: 'positive',
        title: 'Strong Monthly Performance',
        description: `Lead generation is up ${currentTrend.change}% this month vs last month.`,
        value: `+${currentTrend.change}%`
      });
    } else if (currentTrend.change < LEAD_PERFORMANCE_THRESHOLDS.INSIGHTS.DECLINE_MONTHLY_CHANGE) {
      dashboardInsights.push({
        type: 'negative',
        title: 'Monthly Decline',
        description: `Lead generation is down ${Math.abs(currentTrend.change)}% this month. Review recent changes.`,
        value: `${currentTrend.change}%`
      });
    }
  }

  // If no specific insights generated, add a general one
  if (dashboardInsights.length === 0) {
    dashboardInsights.push({
      type: 'neutral',
      title: 'Lead Analytics Available',
      description: 'Your lead analytics are being tracked. Continue building your lead database for more insights.',
      value: `${metrics.totalLeads} total leads`
    });
  }

  return dashboardInsights;
}

// Get comprehensive lead dashboard data
export async function getLeadDashboardData(venueId: string): Promise<LeadDashboardData> {
  try {
    console.log('Fetching comprehensive lead dashboard data for venue:', venueId);

    // Get high interest leads count with real data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { data: highInterestLeadsData, error: highInterestError } = await supabase
      .from('leads')
      .select('id')
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .or('interest_level.eq.high,lead_score.gte.80');

    if (highInterestError) {
      console.error('Error fetching high interest leads:', highInterestError);
    }

    const realHighInterestLeads = highInterestLeadsData?.length || 0;

    const [
      baseMetrics,
      sourceAnalytics,
      timeSeriesData,
      performanceInsights,
      funnelAnalytics
    ] = await Promise.all([
      getLeadMetrics(venueId, 30),
      getLeadSourceAnalytics(venueId, 30),
      getLeadTimeSeriesData(venueId, 30),
      getLeadPerformanceInsights(venueId, 90),
      getLeadFunnelAnalytics(venueId, 30)
    ]);

    // Enhanced metrics with additional fields expected by components
    const metrics = {
      totalLeads: baseMetrics.totalLeads,
      leadsThisMonth: baseMetrics.leadsThisMonth,
      convertedLeads: baseMetrics.convertedLeads,
      tourLeads: sourceAnalytics.tour.count,
      avgLeadScore: baseMetrics.avgLeadScore,
      highInterestLeads: realHighInterestLeads, // Use real data instead of estimate
      qualifiedLeads: baseMetrics.qualifiedLeads,
      conversionRate: baseMetrics.conversionRate,
      leadGrowthRate: baseMetrics.leadGrowth,
      averageResponseTime: await calculateAverageResponseTime(venueId, 30),
      followUpRate: baseMetrics.totalLeads > 0 ? 
        Number(((baseMetrics.leadsByStatus.contacted + baseMetrics.leadsByStatus.qualified + baseMetrics.leadsByStatus.converted) / baseMetrics.totalLeads * 100).toFixed(1)) : 0,
      leadsByStatus: {
        new: baseMetrics.leadsByStatus.new,
        contacted: baseMetrics.leadsByStatus.contacted,
        qualified: baseMetrics.leadsByStatus.qualified,
        converted: baseMetrics.leadsByStatus.converted
      }
    };

    // Convert performance insights to dashboard insights format
    const insights = convertPerformanceInsightsToDashboardInsights(performanceInsights, metrics);

    const dashboardData: LeadDashboardData = {
      metrics,
      sourceAnalytics,
      timeSeriesData,
      insights,
      funnelAnalytics
    };

    console.log('Lead dashboard data compiled successfully');
    return dashboardData;
  } catch (error) {
    console.error('Error in getLeadDashboardData:', error);
    throw error;
  }
}

// Calculate average response time in hours
async function calculateAverageResponseTime(venueId: string, days: number = 30): Promise<number> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get leads from the period with their activities
    const { data: leadsWithActivities, error } = await supabase
      .from('leads')
      .select(`
        id,
        created_at,
        lead_activities(
          id,
          activity_type,
          created_at
        )
      `)
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads for response time calculation:', error);
      return 0;
    }

    if (!leadsWithActivities || leadsWithActivities.length === 0) {
      return 0;
    }

    let totalResponseTimeHours = 0;
    let respondedLeadsCount = 0;

    // Calculate response time for each lead
    leadsWithActivities.forEach((lead: any) => {
      const leadCreatedAt = new Date(lead.created_at);
      const activities = lead.lead_activities || [];
      
      // Find first contact activity (call, email, or contacted status change)
      const firstContactActivity = activities
        .filter((activity: any) => 
          ['call_made', 'email_sent', 'contacted'].includes(activity.activity_type)
        )
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

      if (firstContactActivity) {
        const firstContactAt = new Date(firstContactActivity.created_at);
        const responseTimeMs = firstContactAt.getTime() - leadCreatedAt.getTime();
        const responseTimeHours = responseTimeMs / (1000 * 60 * 60); // Convert to hours

        // Only count reasonable response times (ignore negative or extremely large values)
        if (responseTimeHours >= 0 && responseTimeHours <= 720) { // Max 30 days
          totalResponseTimeHours += responseTimeHours;
          respondedLeadsCount++;
        }
      }
    });

    // Return average response time in hours, rounded to 1 decimal place
    if (respondedLeadsCount === 0) {
      return 0;
    }

    const averageResponseTime = totalResponseTimeHours / respondedLeadsCount;
    return Number(averageResponseTime.toFixed(1));
  } catch (error) {
    console.error('Error calculating average response time:', error);
    return 0;
  }
} 