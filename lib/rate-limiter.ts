import { supabaseServiceRole as supabase } from './supabase-service-role';

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  requestsPerWeek: number;
  requestsPerMonth: number;
  burstLimit: number;
  enabled: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limitType: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'burst';
  message?: string;
}

export class RateLimiter {
  // Get rate limit configuration for a specific venue/chatbot
  private async getRateLimitConfig(venueId: string, chatbotType: 'tour'): Promise<RateLimitConfig> {
    console.log(`🔍 Getting rate limit config for venue: ${venueId}, type: ${chatbotType}`);
    
    const { data: rows, error } = await supabase
      .from('chatbot_configs')
      .select(`
        rate_limit_requests_per_minute,
        rate_limit_requests_per_hour,
        rate_limit_requests_per_day,
        rate_limit_requests_per_week,
        rate_limit_requests_per_month,
        rate_limit_burst_limit,
        enable_rate_limiting
      `)
      .eq('venue_id', venueId)
      .eq('chatbot_type', chatbotType)
      .limit(1);

    const data = rows && rows.length > 0 ? rows[0] : null;

    if (error || !data) {
      console.log(`❌ Failed to get rate limit config, using defaults:`, error);
      // Default fallback limits
      return {
        requestsPerMinute: 30,
        requestsPerHour: 100,
        requestsPerDay: 500,
        requestsPerWeek: 2000,
        requestsPerMonth: 8000,
        burstLimit: 10,
        enabled: true
      };
    }

    const config = {
      requestsPerMinute: data.rate_limit_requests_per_minute || 30,
      requestsPerHour: data.rate_limit_requests_per_hour || 100,
      requestsPerDay: data.rate_limit_requests_per_day || 500,
      requestsPerWeek: data.rate_limit_requests_per_week || 2000,
      requestsPerMonth: data.rate_limit_requests_per_month || 8000,
      burstLimit: data.rate_limit_burst_limit || 10,
      enabled: data.enable_rate_limiting ?? true
    };

    console.log(`✅ Rate limit config loaded:`, config);
    return config;
  }

  // Check if request is allowed
  async checkRateLimit(
    venueId: string, 
    chatbotType: 'tour', 
    ipAddress: string
  ): Promise<RateLimitResult> {
    console.log(`🚦 Checking rate limit for venue: ${venueId}, type: ${chatbotType}, IP: ${ipAddress}`);
    
    const config = await this.getRateLimitConfig(venueId, chatbotType);

    if (!config.enabled) {
      console.log(`🔓 Rate limiting disabled, allowing request`);
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 60000),
        limitType: 'minute'
      };
    }

    // Use a log-first strategy so this request is included in checks.
    const now = new Date();
    const minuteStart = new Date(now.getTime() - 60000);
    const hourStart = new Date(now.getTime() - 3600000);
    const dayStart = new Date(now.getTime() - 86400000);
    const weekStart = new Date(now.getTime() - 604800000); // 7 days
    const monthStart = new Date(now.getTime() - 2592000000); // 30 days

    await this.logRequest(venueId, chatbotType, ipAddress, now);

    const currentMinuteCount = await this.getRequestCount(venueId, chatbotType, ipAddress, minuteStart, now);
    const currentHourCount = await this.getRequestCount(venueId, chatbotType, ipAddress, hourStart, now);
    const currentDayCount = await this.getRequestCount(venueId, chatbotType, ipAddress, dayStart, now);
    const currentWeekCount = await this.getRequestCount(venueId, chatbotType, ipAddress, weekStart, now);
    const currentMonthCount = await this.getRequestCount(venueId, chatbotType, ipAddress, monthStart, now);

    console.log(`📊 Current minute count: ${currentMinuteCount}/${config.requestsPerMinute}`);
    console.log(`📊 Current hour count: ${currentHourCount}/${config.requestsPerHour}`);
    console.log(`📊 Current day count: ${currentDayCount}/${config.requestsPerDay}`);
    console.log(`📊 Current week count: ${currentWeekCount}/${config.requestsPerWeek}`);
    console.log(`📊 Current month count: ${currentMonthCount}/${config.requestsPerMonth}`);

    // Check each time window in order of strictness (post-log, so deny only when over limit).
    const checks = [
      { 
        count: currentMinuteCount, 
        limit: config.requestsPerMinute, 
        type: 'minute' as const, 
        resetTime: new Date(Math.ceil(now.getTime() / 60000) * 60000) 
      },
      { 
        count: currentHourCount, 
        limit: config.requestsPerHour, 
        type: 'hour' as const, 
        resetTime: new Date(Math.ceil(now.getTime() / 3600000) * 3600000) 
      },
      { 
        count: currentDayCount, 
        limit: config.requestsPerDay, 
        type: 'day' as const, 
        resetTime: new Date(Math.ceil(now.getTime() / 86400000) * 86400000) 
      },
      { 
        count: currentWeekCount, 
        limit: config.requestsPerWeek, 
        type: 'week' as const, 
        resetTime: new Date(Math.ceil(now.getTime() / 604800000) * 604800000) 
      },
      { 
        count: currentMonthCount, 
        limit: config.requestsPerMonth, 
        type: 'month' as const, 
        resetTime: new Date(Math.ceil(now.getTime() / 2592000000) * 2592000000) 
      }
    ];

    for (const check of checks) {
      if (check.count > check.limit) {
        console.log(`🚫 Rate limit exceeded! ${check.count}/${check.limit} requests in last ${check.type}`);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: check.resetTime,
          limitType: check.type,
          message: `Rate limit exceeded: ${check.count}/${check.limit} requests per ${check.type}`
        };
      }
    }

    const remaining = Math.min(
      config.requestsPerMinute - currentMinuteCount,
      config.requestsPerHour - currentHourCount,
      config.requestsPerDay - currentDayCount,
      config.requestsPerWeek - currentWeekCount,
      config.requestsPerMonth - currentMonthCount
    );

    console.log(`✅ Request allowed! Remaining: ${remaining}`);

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      resetTime: new Date(Math.ceil(now.getTime() / 60000) * 60000),
      limitType: 'minute'
    };
  }

  // Log a request
  private async logRequest(
    venueId: string, 
    chatbotType: 'tour', 
    ipAddress: string, 
    timestamp: Date
  ): Promise<void> {
    const windowStart = new Date(timestamp);
    windowStart.setSeconds(0, 0); // Round to start of minute

    console.log(`📝 Logging request for ${ipAddress} at ${windowStart.toISOString()}`);

    try {
      // Use the SQL function for atomic increment
      const { error } = await supabase.rpc('increment_rate_limit_count', {
        p_venue_id: venueId,
        p_chatbot_type: chatbotType,
        p_ip_address: ipAddress,
        p_window_start: windowStart.toISOString()
      });

      if (error) {
        console.error('❌ Failed to log rate limit request:', error);
      } else {
        console.log(`✅ Request logged successfully`);
      }
    } catch (error) {
      console.error('❌ Exception logging rate limit request:', error);
    }
  }

  // Get request count for a specific time window
  private async getRequestCount(
    venueId: string, 
    chatbotType: 'tour', 
    ipAddress: string, 
    windowStart: Date,
    windowEnd: Date
  ): Promise<number> {
    const { data, error } = await supabase
      .from('rate_limit_logs')
      .select('requests_count')
      .eq('venue_id', venueId)
      .eq('chatbot_type', chatbotType)
      .eq('ip_address', ipAddress)
      .gte('window_start', windowStart.toISOString())
      .lt('window_start', windowEnd.toISOString());

    if (error) {
      console.error('❌ Error querying rate limit logs:', error);
      return 0;
    }

    const total = data?.reduce((sum, log) => sum + log.requests_count, 0) || 0;
    console.log(`📊 Request count for ${ipAddress} in window ${windowStart.toISOString()} to ${windowEnd.toISOString()}: ${total}`);
    
    return total;
  }
}

// Create a singleton instance
export const rateLimiter = new RateLimiter(); 