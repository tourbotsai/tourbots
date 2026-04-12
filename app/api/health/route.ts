import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { openAIService } from '@/lib/openai-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  const authError = await requirePlatformAdmin(request);
  if (authError) return authError;

  const startTime = Date.now();
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: 'unknown', responseTime: 0 },
      openai: { status: 'unknown', responseTime: 0 },
      stripe: { status: 'unknown', responseTime: 0 },
      resend: { status: 'unknown', responseTime: 0 }
    },
    stats: {
      totalVenues: 0,
      activeUsers: 0,
      conversationsToday: 0,
      activeSessions: 0,
      activeVenuesThisMonth: 0,
      monthlyRevenue: 0
    }
  };

  // Check Database
  try {
    const dbStart = Date.now();
    const { data: venueProbe, error: dbError } = await supabase
      .from('venues')
      .select('id')
      .limit(1);
    
    healthCheck.services.database.responseTime = Date.now() - dbStart;
    healthCheck.services.database.status = dbError ? 'error' : 'healthy';
  } catch (error) {
    healthCheck.services.database.status = 'error';
  }

  // Check OpenAI (simple check if API key exists)
  try {
    const openaiStart = Date.now();
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    healthCheck.services.openai.responseTime = Date.now() - openaiStart;
    healthCheck.services.openai.status = hasApiKey ? 'healthy' : 'error';
  } catch (error) {
    healthCheck.services.openai.status = 'error';
  }

  // Check Stripe (simple check if secret key exists)
  try {
    const stripeStart = Date.now();
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    healthCheck.services.stripe.responseTime = Date.now() - stripeStart;
    healthCheck.services.stripe.status = hasStripeKey ? 'healthy' : 'error';
  } catch (error) {
    healthCheck.services.stripe.status = 'error';
  }

  // Check Resend (email service)
  try {
    const resendStart = Date.now();
    const hasResendKey = !!process.env.RESEND_API_KEY;
    healthCheck.services.resend.responseTime = Date.now() - resendStart;
    healthCheck.services.resend.status = hasResendKey ? 'healthy' : 'error';
  } catch (error) {
    healthCheck.services.resend.status = 'error';
  }

  // Get Platform Stats (only if database is healthy)
  if (healthCheck.services.database.status === 'healthy') {
    try {
      // Total venues
      const { count: totalVenues } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true });
      healthCheck.stats.totalVenues = totalVenues || 0;

      // Active Users (users who have logged in in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());
      healthCheck.stats.activeUsers = activeUsers || 0;

      // Conversations Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: conversationsToday } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      healthCheck.stats.conversationsToday = conversationsToday || 0;

      // Active Sessions (conversations in last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const { count: activeSessions } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', oneHourAgo.toISOString());
      healthCheck.stats.activeSessions = activeSessions || 0;

      // Active venues this month (venues with activity this month)
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { data: activeVenuesData } = await supabase
        .from('conversations')
        .select('venue_id')
        .gte('created_at', firstDayOfMonth.toISOString());
      
      const uniqueVenueIds = new Set(activeVenuesData?.map(conv => conv.venue_id) || []);
      healthCheck.stats.activeVenuesThisMonth = uniqueVenueIds.size;

      // Monthly Revenue (from subscriptions)
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan_name, status')
        .eq('status', 'active');

      let monthlyRevenue = 0;
      subscriptions?.forEach(sub => {
        if (sub.plan_name === 'essential') {
          monthlyRevenue += 99; // £99/month
        } else if (sub.plan_name === 'professional') {
          monthlyRevenue += 199; // £199/month
        }
      });
      healthCheck.stats.monthlyRevenue = monthlyRevenue;

    } catch (error) {
      console.error('Error fetching platform stats:', error);
      // Keep default values if stats fail
    }
  }

  // Determine overall status
  const serviceStatuses = Object.values(healthCheck.services).map(s => s.status);
  const hasErrors = serviceStatuses.includes('error');
  const hasUnknown = serviceStatuses.includes('unknown');
  
  if (hasErrors) {
    healthCheck.status = 'degraded';
  } else if (hasUnknown) {
    healthCheck.status = 'unknown';
  } else {
    healthCheck.status = 'healthy';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 207 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
} 