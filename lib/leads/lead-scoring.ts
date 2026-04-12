import { Lead, ConversationMessage } from '../types';
import { calculateAILeadScore, calculateDetailedAILeadScore, AIScoringResult } from '../services/ai-scoring-service';

// Legacy interfaces maintained for backward compatibility
export interface LeadScoringFactors {
  interestLevel: number;
  conversationEngagement: number;
  specificInterests: number;
  timing: number;
  contactQuality: number;
}

export interface LeadScoringResult {
  score: number;
  factors: LeadScoringFactors;
  reasoning: string[];
}

// Main scoring function - now AI-powered
export async function calculateLeadScore(
  lead: Lead, 
  conversationMessages: Array<{ content: string; timestamp?: string }> = []
): Promise<number> {
  try {
    console.log('Calculating AI-powered lead score for lead:', lead.id);

    // Convert legacy message format to ConversationMessage format
    const conversationHistory: ConversationMessage[] = conversationMessages.map((msg, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: msg.content,
      timestamp: msg.timestamp
    }));

    // Calculate AI score
    const score = await calculateAILeadScore(lead, conversationHistory);
    
    console.log('AI lead score calculated:', {
      leadId: lead.id,
      score
    });

    return score;
  } catch (error) {
    console.error('Error calculating AI lead score:', error);
    return 0;
  }
}

// Legacy function maintained for backward compatibility
export function calculateDetailedLeadScore(
  lead: Lead, 
  conversationMessages: Array<{ content: string; timestamp?: string }> = []
): LeadScoringResult {
  console.warn('calculateDetailedLeadScore is deprecated, use calculateLeadScore instead');
  
  // Convert to new format and calculate synchronously with fallback
  const conversationHistory: ConversationMessage[] = conversationMessages.map((msg, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: msg.content,
    timestamp: msg.timestamp
  }));

  // Use fallback scoring for synchronous legacy support
  const score = calculateLegacyFallbackScore(lead, conversationHistory);
  
  // Create legacy factors breakdown (simplified)
  const factors: LeadScoringFactors = {
    interestLevel: lead.interest_level === 'high' ? 25 : lead.interest_level === 'medium' ? 15 : 5,
    conversationEngagement: Math.min(conversationMessages.length * 2, 20),
    specificInterests: Math.min((lead.interests?.length || 0) * 4, 20),
    timing: calculateTimingScore(lead),
    contactQuality: calculateContactScore(lead)
  };

  const reasoning = [
    `Interest level (${lead.interest_level}): +${factors.interestLevel} points`,
    `Conversation engagement (${conversationMessages.length} messages): +${factors.conversationEngagement} points`,
    `Specific interests (${lead.interests?.length || 0}): +${factors.specificInterests} points`,
    `Timing factor: +${factors.timing} points`,
    `Contact quality: +${factors.contactQuality} points`,
    'Note: This is legacy scoring. Consider upgrading to AI-powered scoring.'
  ];

  return {
    score,
    factors,
    reasoning
  };
}

// Get lead score category
export function getLeadScoreCategory(score: number): {
  category: 'hot' | 'warm' | 'cold';
  label: string;
  color: string;
} {
  if (score >= 80) {
    return {
      category: 'hot',
      label: 'Hot Lead',
      color: '#ef4444' // red
    };
  } else if (score >= 60) {
    return {
      category: 'warm',
      label: 'Warm Lead',
      color: '#f59e0b' // amber
    };
  } else {
    return {
      category: 'cold',
      label: 'Cold Lead',
      color: '#6b7280' // gray
    };
  }
}

// Get scoring insights for analytics
export function getLeadScoringInsights(leads: Lead[]): {
  averageScore: number;
  scoreDistribution: Record<string, number>;
  topScoringFactors: string[];
} {
  if (leads.length === 0) {
    return {
      averageScore: 0,
      scoreDistribution: {},
      topScoringFactors: []
    };
  }

  const scores = leads.map(lead => lead.lead_score || 0);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  const scoreDistribution: Record<string, number> = {
    'Hot (80-100)': 0,
    'Warm (60-79)': 0,
    'Medium (40-59)': 0,
    'Cold (0-39)': 0
  };

  scores.forEach(score => {
    if (score >= 80) scoreDistribution['Hot (80-100)']++;
    else if (score >= 60) scoreDistribution['Warm (60-79)']++;
    else if (score >= 40) scoreDistribution['Medium (40-59)']++;
    else scoreDistribution['Cold (0-39)']++;
  });

  // Updated factors for AI scoring
  const topScoringFactors = [
    'AI conversation analysis',
    'Interest level assessment',
    'Engagement quality evaluation',
    'Contact information completeness',
    'Intent to purchase indicators'
  ];

  return {
    averageScore: Number(averageScore.toFixed(1)),
    scoreDistribution,
    topScoringFactors
  };
}

// AI-powered detailed scoring with full metadata
export async function calculateDetailedAIScore(
  lead: Lead,
  conversationMessages: Array<{ content: string; timestamp?: string }> = []
): Promise<AIScoringResult> {
  // Convert legacy message format
  const conversationHistory: ConversationMessage[] = conversationMessages.map((msg, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: msg.content,
    timestamp: msg.timestamp
  }));

  return await calculateDetailedAILeadScore(lead, conversationHistory);
}

// Helper functions for legacy compatibility
function calculateLegacyFallbackScore(lead: Lead, conversationHistory: ConversationMessage[]): number {
  let score = 20; // Base score
  
  // Contact information
  if (lead.visitor_email) score += 20;
  if (lead.visitor_phone) score += 15;
  if (lead.visitor_name && lead.visitor_name.trim().split(' ').length >= 2) score += 5;
  
  // Interest level
  switch (lead.interest_level) {
    case 'high': score += 25; break;
    case 'medium': score += 15; break;
    case 'low': score += 5; break;
  }
  
  // Conversation engagement
  const messageCount = conversationHistory.length;
  if (messageCount >= 10) score += 20;
  else if (messageCount >= 6) score += 15;
  else if (messageCount >= 3) score += 10;
  else score += 5;
  
  return Math.min(Math.max(score, 0), 100);
}

function calculateTimingScore(lead: Lead): number {
  const hoursOld = lead.created_at 
    ? (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)
    : 0;
  
  if (hoursOld <= 1) return 15;
  else if (hoursOld <= 24) return 12;
  else if (hoursOld <= 72) return 8;
  else return 3;
}

function calculateContactScore(lead: Lead): number {
  let score = 0;
  if (lead.visitor_email) score += 10;
  if (lead.visitor_phone) score += 8;
  if (lead.visitor_name && lead.visitor_name.trim().split(' ').length >= 2) score += 2;
  return score;
} 