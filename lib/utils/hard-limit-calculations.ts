import { HardLimitConfig, HardLimitUsage, HardLimitStatus } from '../types';

// Alert thresholds (percentage of limit)
export const HARD_LIMIT_ALERT_THRESHOLDS = {
  WARNING: 80, // 80% of limit
  CRITICAL: 95, // 95% of limit
} as const;

// Calculate usage percentage for a given period
export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.round((used / limit) * 100);
}

// Get the highest usage percentage across all periods
export function getMaxUsagePercentage(usage: HardLimitUsage, config: HardLimitConfig): number {
  if (!config.enabled) return 0;
  
  const percentages = [
    calculateUsagePercentage(usage.daily_messages_used, config.dailyMessages),
    calculateUsagePercentage(usage.weekly_messages_used, config.weeklyMessages),
    calculateUsagePercentage(usage.monthly_messages_used, config.monthlyMessages),
    calculateUsagePercentage(usage.yearly_messages_used, config.yearlyMessages),
  ];
  
  return Math.max(...percentages);
}

// Check if usage is approaching any limits
export function isApproachingLimit(usage: HardLimitUsage, config: HardLimitConfig): boolean {
  if (!config.enabled) return false;
  
  const maxPercentage = getMaxUsagePercentage(usage, config);
  return maxPercentage >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING;
}

// Get alert status for each period
export function getAlertStatus(usage: HardLimitUsage, config: HardLimitConfig) {
  if (!config.enabled) {
    return { daily: false, weekly: false, monthly: false, yearly: false };
  }
  
  return {
    daily: calculateUsagePercentage(usage.daily_messages_used, config.dailyMessages) >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING,
    weekly: calculateUsagePercentage(usage.weekly_messages_used, config.weeklyMessages) >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING,
    monthly: calculateUsagePercentage(usage.monthly_messages_used, config.monthlyMessages) >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING,
    yearly: calculateUsagePercentage(usage.yearly_messages_used, config.yearlyMessages) >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING,
  };
}

// Calculate remaining messages for each period
export function getRemainingMessages(usage: HardLimitUsage, config: HardLimitConfig) {
  if (!config.enabled) {
    return { daily: 999999, weekly: 999999, monthly: 999999, yearly: 999999 };
  }
  
  return {
    daily: Math.max(0, config.dailyMessages - usage.daily_messages_used),
    weekly: Math.max(0, config.weeklyMessages - usage.weekly_messages_used),
    monthly: Math.max(0, config.monthlyMessages - usage.monthly_messages_used),
    yearly: Math.max(0, config.yearlyMessages - usage.yearly_messages_used),
  };
}

// Get the most restrictive remaining count (minimum across all periods)
export function getMinRemainingMessages(usage: HardLimitUsage, config: HardLimitConfig): number {
  if (!config.enabled) return 999999;
  
  const remaining = getRemainingMessages(usage, config);
  return Math.min(remaining.daily, remaining.weekly, remaining.monthly, remaining.yearly);
}

// Calculate next reset time for each period
export function getNextResetTimes() {
  const now = new Date();
  
  // Daily reset (midnight)
  const dailyReset = new Date(now);
  dailyReset.setDate(dailyReset.getDate() + 1);
  dailyReset.setHours(0, 0, 0, 0);
  
  // Weekly reset (Monday midnight)
  const weeklyReset = new Date(now);
  const daysUntilMonday = (7 - now.getDay() + 1) % 7 || 7;
  weeklyReset.setDate(weeklyReset.getDate() + daysUntilMonday);
  weeklyReset.setHours(0, 0, 0, 0);
  
  // Monthly reset (1st of next month)
  const monthlyReset = new Date(now);
  monthlyReset.setMonth(monthlyReset.getMonth() + 1);
  monthlyReset.setDate(1);
  monthlyReset.setHours(0, 0, 0, 0);
  
  // Yearly reset (1st January next year)
  const yearlyReset = new Date(now);
  yearlyReset.setFullYear(yearlyReset.getFullYear() + 1);
  yearlyReset.setMonth(0);
  yearlyReset.setDate(1);
  yearlyReset.setHours(0, 0, 0, 0);
  
  return {
    daily: dailyReset,
    weekly: weeklyReset,
    monthly: monthlyReset,
    yearly: yearlyReset,
  };
}

// Get time until next reset for the most urgent period
export function getTimeUntilNextReset(usage: HardLimitUsage, config: HardLimitConfig): { 
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  resetTime: Date;
  timeRemaining: number; // milliseconds
} {
  if (!config.enabled) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { period: 'daily', resetTime: tomorrow, timeRemaining: 86400000 };
  }
  
  const resetTimes = getNextResetTimes();
  const now = Date.now();
  
  // Find the period with the highest usage percentage
  const usagePercentages = [
    { period: 'daily' as const, percentage: calculateUsagePercentage(usage.daily_messages_used, config.dailyMessages), resetTime: resetTimes.daily },
    { period: 'weekly' as const, percentage: calculateUsagePercentage(usage.weekly_messages_used, config.weeklyMessages), resetTime: resetTimes.weekly },
    { period: 'monthly' as const, percentage: calculateUsagePercentage(usage.monthly_messages_used, config.monthlyMessages), resetTime: resetTimes.monthly },
    { period: 'yearly' as const, percentage: calculateUsagePercentage(usage.yearly_messages_used, config.yearlyMessages), resetTime: resetTimes.yearly },
  ];
  
  // Sort by usage percentage (highest first)
  usagePercentages.sort((a, b) => b.percentage - a.percentage);
  
  const mostUsed = usagePercentages[0];
  
  return {
    period: mostUsed.period,
    resetTime: mostUsed.resetTime,
    timeRemaining: mostUsed.resetTime.getTime() - now,
  };
}

// Format time remaining as human-readable string
export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

// Create a complete hard limit status object for UI consumption
export function createHardLimitStatus(usage: HardLimitUsage | null, config: HardLimitConfig): HardLimitStatus {
  if (!usage) {
    // Return empty status if no usage data
    return {
      config,
      usage: {
        id: '',
        venue_id: '',
        chatbot_type: 'tour',
        daily_messages_used: 0,
        weekly_messages_used: 0,
        monthly_messages_used: 0,
        yearly_messages_used: 0,
        daily_reset_at: new Date().toISOString(),
        weekly_reset_at: new Date().toISOString(),
        monthly_reset_at: new Date().toISOString(),
        yearly_reset_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      isApproachingLimit: false,
      alerts: { daily: false, weekly: false, monthly: false, yearly: false },
    };
  }
  
  return {
    config,
    usage,
    isApproachingLimit: isApproachingLimit(usage, config),
    alerts: getAlertStatus(usage, config),
  };
}

// Validate hard limit configuration
export function validateHardLimitConfig(config: Partial<HardLimitConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.dailyMessages !== undefined && (config.dailyMessages < 1 || config.dailyMessages > 100000)) {
    errors.push('Daily messages must be between 1 and 100,000');
  }
  
  if (config.weeklyMessages !== undefined && (config.weeklyMessages < 1 || config.weeklyMessages > 1000000)) {
    errors.push('Weekly messages must be between 1 and 1,000,000');
  }
  
  if (config.monthlyMessages !== undefined && (config.monthlyMessages < 1 || config.monthlyMessages > 10000000)) {
    errors.push('Monthly messages must be between 1 and 10,000,000');
  }
  
  if (config.yearlyMessages !== undefined && (config.yearlyMessages < 1 || config.yearlyMessages > 100000000)) {
    errors.push('Yearly messages must be between 1 and 100,000,000');
  }
  
  // Logical validation removed - you can now set any limits independently
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get color coding for usage percentage
export function getUsageColor(percentage: number): 'green' | 'yellow' | 'red' {
  if (percentage >= HARD_LIMIT_ALERT_THRESHOLDS.CRITICAL) return 'red';
  if (percentage >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING) return 'yellow';
  return 'green';
}

// Get usage level description
export function getUsageLevel(percentage: number): 'low' | 'moderate' | 'high' | 'critical' {
  if (percentage >= HARD_LIMIT_ALERT_THRESHOLDS.CRITICAL) return 'critical';
  if (percentage >= HARD_LIMIT_ALERT_THRESHOLDS.WARNING) return 'high';
  if (percentage >= 50) return 'moderate';
  return 'low';
} 