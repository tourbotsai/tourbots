import { supabaseServiceRole as supabase } from '../supabase-service-role';
import { HardLimitConfig, HardLimitResult, HardLimitUsage } from '../types';

interface HardLimitFunctionResult {
  daily_used: number;
  weekly_used: number;
  monthly_used: number;
  yearly_used: number;
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  yearly_limit: number;
  limits_enabled: boolean;
}

export class HardLimitService {
  private createFailClosedResult(): HardLimitResult {
    const retryAt = new Date(Date.now() + 5 * 60 * 1000);
    return {
      allowed: false,
      limitType: null,
      currentUsage: 0,
      limit: 0,
      resetTime: retryAt,
      remaining: 0,
      usagePercentage: 100,
      message: 'Hard limit service is temporarily unavailable. Please try again shortly.'
    };
  }

  // Resolve tour scope in one place so TS and SQL paths use identical selection.
  async resolveScopedTourId(venueId: string, requestedTourId?: string): Promise<string | null> {
    try {
      if (requestedTourId) {
        const { data: requestedTour, error } = await supabase
          .from('tours')
          .select('id')
          .eq('id', requestedTourId)
          .eq('venue_id', venueId)
          .eq('is_active', true)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Error validating requested tour scope:', error);
          return null;
        }

        return requestedTour?.id || null;
      }

      const { data: tours, error } = await supabase
        .from('tours')
        .select('id, tour_type, display_order, created_at')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .limit(100);

      if (error) {
        console.error('❌ Error resolving scoped tour:', error);
        return null;
      }

      const orderedTours = (tours || []).sort((a: any, b: any) => {
        const aPriority = a?.tour_type === 'primary' ? 0 : 1;
        const bPriority = b?.tour_type === 'primary' ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;

        const aDisplay = typeof a?.display_order === 'number' ? a.display_order : Number.MAX_SAFE_INTEGER;
        const bDisplay = typeof b?.display_order === 'number' ? b.display_order : Number.MAX_SAFE_INTEGER;
        if (aDisplay !== bDisplay) return aDisplay - bDisplay;

        const aCreated = Date.parse(a?.created_at || '') || 0;
        const bCreated = Date.parse(b?.created_at || '') || 0;
        return aCreated - bCreated;
      });

      return orderedTours[0]?.id || null;
    } catch (error) {
      console.error('❌ Exception resolving scoped tour:', error);
      return null;
    }
  }

  // Get hard limit configuration for a specific venue/chatbot
  private async getHardLimitConfig(venueId: string, chatbotType: 'tour', tourId: string): Promise<HardLimitConfig> {
    console.log(`🔍 Getting hard limit config for venue: ${venueId}, type: ${chatbotType}`);
    
    const query = supabase
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
      .eq('tour_id', tourId);

    const { data: rows, error } = await query.limit(1);
    const data = rows && rows.length > 0 ? rows[0] : null;

    if (error || !data) {
      console.log(`❌ Failed to get hard limit config, using defaults:`, error);
      // Default fallback limits
      return {
        enabled: false,
        dailyMessages: 1000,
        weeklyMessages: 3000,
        monthlyMessages: 10000,
        yearlyMessages: 100000
      };
    }

    const config = {
      enabled: data.hard_limits_enabled ?? false,
      dailyMessages: data.hard_limit_daily_messages || 1000,
      weeklyMessages: data.hard_limit_weekly_messages || 3000,
      monthlyMessages: data.hard_limit_monthly_messages || 10000,
      yearlyMessages: data.hard_limit_yearly_messages || 100000
    };

    console.log(`✅ Hard limit config loaded:`, config);
    return config;
  }

  // Check limits without mutating counters (used before expensive model calls)
  async checkHardLimitPreflight(
    venueId: string,
    chatbotType: 'tour',
    tourId?: string
  ): Promise<HardLimitResult> {
    console.log(`🧪 Preflight hard limit check for venue: ${venueId}, type: ${chatbotType}`);

    const scopedTourId = await this.resolveScopedTourId(venueId, tourId);
    if (!scopedTourId) {
      console.error(`❌ No active scoped tour found for venue: ${venueId}`);
      return this.createFailClosedResult();
    }

    const config = await this.getHardLimitConfig(venueId, chatbotType, scopedTourId);

    if (!config.enabled) {
      return {
        allowed: true,
        limitType: null,
        currentUsage: 0,
        limit: 0,
        resetTime: new Date(Date.now() + 86400000),
        remaining: 999999,
        usagePercentage: 0
      };
    }

    const usage = await this.getCurrentUsage(venueId, chatbotType, scopedTourId);
    const dailyUsed = usage?.daily_messages_used || 0;
    const weeklyUsed = usage?.weekly_messages_used || 0;
    const monthlyUsed = usage?.monthly_messages_used || 0;
    const yearlyUsed = usage?.yearly_messages_used || 0;

    const checks = [
      {
        used: dailyUsed,
        limit: config.dailyMessages,
        type: 'daily' as const,
        resetTime: this.getNextResetTime('daily')
      },
      {
        used: weeklyUsed,
        limit: config.weeklyMessages,
        type: 'weekly' as const,
        resetTime: this.getNextResetTime('weekly')
      },
      {
        used: monthlyUsed,
        limit: config.monthlyMessages,
        type: 'monthly' as const,
        resetTime: this.getNextResetTime('monthly')
      },
      {
        used: yearlyUsed,
        limit: config.yearlyMessages,
        type: 'yearly' as const,
        resetTime: this.getNextResetTime('yearly')
      }
    ];

    for (const check of checks) {
      // Preflight blocks once usage reaches configured cap.
      if (check.used >= check.limit) {
        return {
          allowed: false,
          limitType: check.type,
          currentUsage: check.used,
          limit: check.limit,
          resetTime: check.resetTime,
          remaining: 0,
          usagePercentage: Math.round((check.used / check.limit) * 100),
          message: `Hard limit exceeded: ${check.used}/${check.limit} messages per ${check.type}`
        };
      }
    }

    const remaining = Math.min(
      config.dailyMessages - dailyUsed,
      config.weeklyMessages - weeklyUsed,
      config.monthlyMessages - monthlyUsed,
      config.yearlyMessages - yearlyUsed
    );

    const usagePercentages = checks.map((check) => (check.used / check.limit) * 100);
    const maxUsagePercentage = Math.max(...usagePercentages);

    return {
      allowed: true,
      limitType: null,
      currentUsage: dailyUsed,
      limit: config.dailyMessages,
      resetTime: this.getNextResetTime('daily'),
      remaining: Math.max(0, remaining),
      usagePercentage: Math.round(maxUsagePercentage)
    };
  }

  // Check if request is allowed and increment usage
  async checkHardLimit(
    venueId: string, 
    chatbotType: 'tour',
    tourId?: string
  ): Promise<HardLimitResult> {
    console.log(`🚦 Checking hard limit for venue: ${venueId}, type: ${chatbotType}`);
    
    const scopedTourId = await this.resolveScopedTourId(venueId, tourId);
    if (!scopedTourId) {
      console.error(`❌ No active scoped tour found for venue: ${venueId}`);
      return this.createFailClosedResult();
    }

    const config = await this.getHardLimitConfig(venueId, chatbotType, scopedTourId);

    if (!config.enabled) {
      console.log(`🔓 Hard limits disabled, allowing request`);
      return {
        allowed: true,
        limitType: null,
        currentUsage: 0,
        limit: 0,
        resetTime: new Date(Date.now() + 86400000), // 24 hours from now
        remaining: 999999,
        usagePercentage: 0
      };
    }

    try {
      // Use the SQL function to check and increment usage atomically
      const { data, error } = await supabase.rpc('increment_hard_limit_usage', {
        p_venue_id: venueId,
        p_chatbot_type: chatbotType,
        p_tour_id: scopedTourId
      });

      if (error) {
        console.error('❌ Error calling increment_hard_limit_usage:', error);
        return this.createFailClosedResult();
      }

      if (!data || data.length === 0) {
        console.error('❌ No data returned from increment_hard_limit_usage');
        return this.createFailClosedResult();
      }

      const result = data[0] as HardLimitFunctionResult;
      
      console.log(`📊 Current usage:`, {
        daily: `${result.daily_used}/${result.daily_limit}`,
        weekly: `${result.weekly_used}/${result.weekly_limit}`,
        monthly: `${result.monthly_used}/${result.monthly_limit}`,
        yearly: `${result.yearly_used}/${result.yearly_limit}`
      });

      // Check each limit in order of priority (shortest to longest timeframe)
      const checks = [
        { 
          used: result.daily_used, 
          limit: result.daily_limit, 
          type: 'daily' as const,
          resetTime: this.getNextResetTime('daily')
        },
        { 
          used: result.weekly_used, 
          limit: result.weekly_limit, 
          type: 'weekly' as const,
          resetTime: this.getNextResetTime('weekly')
        },
        { 
          used: result.monthly_used, 
          limit: result.monthly_limit, 
          type: 'monthly' as const,
          resetTime: this.getNextResetTime('monthly')
        },
        { 
          used: result.yearly_used, 
          limit: result.yearly_limit, 
          type: 'yearly' as const,
          resetTime: this.getNextResetTime('yearly')
        }
      ];

      for (const check of checks) {
        if (check.used > check.limit) {
          console.log(`🚫 Hard limit exceeded! ${check.used}/${check.limit} messages in ${check.type} period`);
          
          return {
            allowed: false,
            limitType: check.type,
            currentUsage: check.used,
            limit: check.limit,
            resetTime: check.resetTime,
            remaining: 0,
            usagePercentage: Math.round((check.used / check.limit) * 100),
            message: `Hard limit exceeded: ${check.used}/${check.limit} messages per ${check.type}`
          };
        }
      }

      // Calculate remaining messages (minimum across all periods)
      const remaining = Math.min(
        result.daily_limit - result.daily_used,
        result.weekly_limit - result.weekly_used,
        result.monthly_limit - result.monthly_used,
        result.yearly_limit - result.yearly_used
      );

      // Calculate usage percentage (maximum across all periods)
      const usagePercentages = checks.map(check => (check.used / check.limit) * 100);
      const maxUsagePercentage = Math.max(...usagePercentages);

      console.log(`✅ Request allowed! Remaining: ${remaining}, Usage: ${maxUsagePercentage.toFixed(1)}%`);

      return {
        allowed: true,
        limitType: null,
        currentUsage: result.daily_used, // Show daily usage as primary metric
        limit: result.daily_limit,
        resetTime: this.getNextResetTime('daily'),
        remaining: Math.max(0, remaining),
        usagePercentage: Math.round(maxUsagePercentage)
      };

    } catch (error) {
      console.error('❌ Exception in checkHardLimit:', error);
      return this.createFailClosedResult();
    }
  }

  // Consume one hard-limit unit after successful completion.
  async consumeHardLimit(
    venueId: string,
    chatbotType: 'tour',
    tourId?: string
  ): Promise<HardLimitResult> {
    return this.checkHardLimit(venueId, chatbotType, tourId);
  }

  // Get current usage without incrementing
  async getCurrentUsage(
    venueId: string, 
    chatbotType: 'tour',
    tourId?: string
  ): Promise<HardLimitUsage | null> {
    try {
      const scopedTourId = await this.resolveScopedTourId(venueId, tourId);
      if (!scopedTourId) {
        return null;
      }

      const query = supabase
        .from('chatbot_hard_limit_usage')
        .select('*')
        .eq('venue_id', venueId)
        .eq('chatbot_type', chatbotType)
        .eq('tour_id', scopedTourId)
        .maybeSingle();

      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching hard limit usage:', error);
        return null;
      }

      return (data || null) as HardLimitUsage | null;
    } catch (error) {
      console.error('❌ Exception in getCurrentUsage:', error);
      return null;
    }
  }

  // Reset usage counters (admin function)
  async resetUsage(
    venueId: string, 
    chatbotType: 'tour',
    resetType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all' = 'all',
    tourId?: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 Resetting ${resetType} usage for venue: ${venueId}, type: ${chatbotType}`);

      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (resetType === 'all' || resetType === 'daily') {
        updates.daily_messages_used = 0;
        updates.daily_reset_at = this.getNextResetTime('daily').toISOString();
      }
      if (resetType === 'all' || resetType === 'weekly') {
        updates.weekly_messages_used = 0;
        updates.weekly_reset_at = this.getNextResetTime('weekly').toISOString();
      }
      if (resetType === 'all' || resetType === 'monthly') {
        updates.monthly_messages_used = 0;
        updates.monthly_reset_at = this.getNextResetTime('monthly').toISOString();
      }
      if (resetType === 'all' || resetType === 'yearly') {
        updates.yearly_messages_used = 0;
        updates.yearly_reset_at = this.getNextResetTime('yearly').toISOString();
      }

      let query = supabase
        .from('chatbot_hard_limit_usage')
        .update(updates)
        .eq('venue_id', venueId)
        .eq('chatbot_type', chatbotType);

      if (tourId) {
        query = query.eq('tour_id', tourId);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ Error resetting usage:', error);
        return false;
      }

      console.log(`✅ Usage reset successfully`);
      return true;
    } catch (error) {
      console.error('❌ Exception in resetUsage:', error);
      return false;
    }
  }

  // Calculate next reset time for a given period
  private getNextResetTime(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        return nextDay;
        
      case 'weekly':
        const nextWeek = new Date(now);
        const daysUntilMonday = (7 - now.getDay() + 1) % 7 || 7;
        nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;
        
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth;
        
      case 'yearly':
        const nextYear = new Date(now);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear.setMonth(0);
        nextYear.setDate(1);
        nextYear.setHours(0, 0, 0, 0);
        return nextYear;
        
      default:
        return new Date(now.getTime() + 86400000); // 24 hours
    }
  }
}

// Create a singleton instance
export const hardLimitService = new HardLimitService(); 