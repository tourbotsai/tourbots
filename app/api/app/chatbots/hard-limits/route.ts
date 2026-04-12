import { NextRequest, NextResponse } from 'next/server';
import { hardLimitService } from '@/lib/services/hard-limit-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { HardLimitConfig, HardLimitUsage } from '@/lib/types';
import { createHardLimitStatus } from '@/lib/utils/hard-limit-calculations';
import {
  authenticateChatbotRoute,
  getScopedVenueId,
  ensureTourScope,
  ensureVenueScope,
  logChatbotAudit,
} from '@/lib/chatbot-route-auth';

// Get current hard limit usage for a venue/chatbot
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const requestedVenueId = searchParams.get('venueId');
    const tourId = searchParams.get('tourId');
    const rawType = searchParams.get('chatbotType');
    if (rawType && rawType !== 'tour') {
      return NextResponse.json(
        { error: 'chatbotType must be "tour" or omitted' },
        { status: 400 }
      );
    }
    const chatbotType = 'tour' as const;
    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;
    const venueId = getScopedVenueId(authResult, requestedVenueId);
    if (tourId) {
      const tourScopeError = await ensureTourScope(venueId, tourId);
      if (tourScopeError) return tourScopeError;
    }

    const scopedTourId = await hardLimitService.resolveScopedTourId(venueId, tourId || undefined);
    if (!scopedTourId) {
      return NextResponse.json(
        { error: 'No active tour found for venue' },
        { status: 404 }
      );
    }

    // Get hard limit configuration for the same resolved tour scope used by service usage checks.
    const configQuery = supabase
      .from('chatbot_configs')
      .select(`
        hard_limits_enabled,
        hard_limit_daily_messages,
        hard_limit_weekly_messages,
        hard_limit_monthly_messages,
        hard_limit_yearly_messages
      `)
      .eq('venue_id', venueId)
      .eq('chatbot_type', chatbotType)
      .eq('tour_id', scopedTourId);

    const { data: configRows, error: configError } = await configQuery.limit(1);
    const configData = configRows && configRows.length > 0 ? configRows[0] : null;

    if (configError || !configData) {
      return NextResponse.json(
        { error: 'Chatbot configuration not found' },
        { status: 404 }
      );
    }

    const config: HardLimitConfig = {
      enabled: configData.hard_limits_enabled ?? false,
      dailyMessages: configData.hard_limit_daily_messages || 1000,
      weeklyMessages: configData.hard_limit_weekly_messages || 3000,
      monthlyMessages: configData.hard_limit_monthly_messages || 10000,
      yearlyMessages: configData.hard_limit_yearly_messages || 100000
    };

    // Get current usage
    const usage = await hardLimitService.getCurrentUsage(venueId, chatbotType, scopedTourId);
    
    // Create comprehensive status
    const status = createHardLimitStatus(usage, config);

    return NextResponse.json({
      success: true,
      status,
      config,
      usage: usage || null
    });

  } catch (error: any) {
    console.error('Error fetching hard limit status:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch hard limit status' },
      { status: 500 }
    );
  }
}

// Reset hard limit usage (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    // Reset is a privileged operation. Restrict to platform admins.
    if (authResult.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden: platform admin access required for hard-limit resets' },
        { status: 403 }
      );
    }

    const { venueId: requestedVenueId, chatbotType, resetType, tourId } = await request.json();

    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;
    const venueId = getScopedVenueId(authResult, requestedVenueId);

    if (chatbotType !== undefined && chatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'chatbotType must be "tour" or omitted' },
        { status: 400 }
      );
    }
    const resolvedChatbotType = 'tour' as const;

    // Validate resetType
    const validResetTypes = ['daily', 'weekly', 'monthly', 'yearly', 'all'];
    if (resetType && !validResetTypes.includes(resetType)) {
      return NextResponse.json(
        { error: `resetType must be one of: ${validResetTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Reset usage
    const success = await hardLimitService.resetUsage(
      venueId,
      resolvedChatbotType,
      resetType || 'all',
      tourId || undefined
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reset usage' },
        { status: 500 }
      );
    }

    // Get updated usage
    const usage = await hardLimitService.getCurrentUsage(venueId, resolvedChatbotType, tourId || undefined);
    logChatbotAudit('chatbot_hard_limit_reset', authResult, { reset_type: resetType || 'all' });

    return NextResponse.json({
      success: true,
      message: `${resetType || 'All'} usage reset successfully`,
      usage: usage || null
    });

  } catch (error: any) {
    console.error('Error resetting hard limit usage:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reset hard limit usage' },
      { status: 500 }
    );
  }
} 