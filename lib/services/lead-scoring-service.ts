import { supabase } from '../supabase';
import { Lead } from '../types';
import { calculateLeadScore, calculateDetailedAIScore } from '../leads/lead-scoring';
import { AIScoringResult } from './ai-scoring-service';
import { createLeadActivity } from '../leads/lead-activity-service';

// Simplified scoring events
export const SCORING_EVENTS = {
  LEAD_CREATED: 'lead_created',
  MANUAL_UPDATE: 'manual_update', 
  MESSAGE_ADDED: 'message_added',
  SYSTEM_UPDATE: 'system_update'
} as const;

export interface ScoringUpdateResult {
  lead: Lead;
  scoringResult: {
    score: number;
    previousScore: number;
    scoreChange: number;
    method: 'ai' | 'fallback';
  };
}

// Calculate and update a single lead's score using AI
export async function calculateAndUpdateLeadScore(
  leadId: string,
  venueId: string,
  triggeredBy?: string,
  triggerEvent: string = SCORING_EVENTS.MANUAL_UPDATE
): Promise<ScoringUpdateResult | null> {
  try {
    console.log('Calculating and updating AI score for lead:', leadId);

    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('venue_id', venueId)
      .single();

    if (leadError || !lead) {
      console.error('Lead not found:', leadError);
      return null;
    }

    // Get conversation history for this lead
    const conversationHistory = await getLeadConversationHistory(leadId);

    // Calculate new AI score with detailed result
    const previousScore = lead.lead_score || 0;
    const scoringResult = await calculateDetailedAIScore(lead, conversationHistory);
    const newScore = scoringResult.score;

    // Update the lead with new score
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({ 
        lead_score: newScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('venue_id', venueId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lead score:', updateError);
      throw updateError;
    }

    const scoreChange = newScore - previousScore;

    // Create lead activity for score update
    if (Math.abs(scoreChange) >= 1) { // Track any score change
      await createLeadActivity(
        leadId,
        triggerEvent === SCORING_EVENTS.MANUAL_UPDATE ? 'score_updated' : 'ai_scored',
        triggerEvent === SCORING_EVENTS.MANUAL_UPDATE 
          ? `Score manually updated from ${previousScore} to ${newScore}`
          : `AI recalculated score from ${previousScore} to ${newScore}`,
        triggeredBy,
        {
          old_score: previousScore,
          new_score: newScore,
          score_change: scoreChange,
          method: scoringResult.method,
          confidence: scoringResult.confidence,
          trigger_event: triggerEvent
        }
      );
    }

    // Create scoring history record if score changed significantly
    if (Math.abs(scoreChange) >= 5) {
      await createScoringHistoryRecord({
        lead_id: leadId,
        venue_id: venueId,
        previous_score: previousScore,
        new_score: newScore,
        score_change: scoreChange,
        trigger_event: triggerEvent,
        triggered_by: triggeredBy || 'system',
        method: 'ai_scoring'
      });
    }

    console.log(`AI lead score updated: ${leadId} - ${previousScore} → ${newScore}`);
    
    return {
      lead: updatedLead,
      scoringResult: {
        score: newScore,
        previousScore,
        scoreChange,
        method: 'ai'
      }
    };
  } catch (error) {
    console.error('Error in calculateAndUpdateLeadScore:', error);
    throw error;
  }
}

// Bulk update lead scores using AI
export async function bulkUpdateLeadScores(
  venueId: string, 
  leadIds?: string[],
  triggeredBy?: string
): Promise<{ updated: number; errors: number }> {
  try {
    console.log('Bulk updating AI lead scores for venue:', venueId);

    // Get leads to update
    let query = supabase
      .from('leads')
      .select('*')
      .eq('venue_id', venueId);

    if (leadIds && leadIds.length > 0) {
      query = query.in('id', leadIds);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      console.error('Error fetching leads for bulk update:', leadsError);
      throw leadsError;
    }

    let updated = 0;
    let errors = 0;

    // Process leads in batches of 10 to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (lead) => {
        try {
          await calculateAndUpdateLeadScore(lead.id, venueId, triggeredBy, SCORING_EVENTS.SYSTEM_UPDATE);
          updated++;
        } catch (error) {
          console.error(`Error updating score for lead ${lead.id}:`, error);
          errors++;
        }
      }));

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Bulk AI scoring complete: ${updated} updated, ${errors} errors`);
    return { updated, errors };
  } catch (error) {
    console.error('Error in bulkUpdateLeadScores:', error);
    throw error;
  }
}

// Get detailed AI scoring for a lead
export async function getDetailedLeadScore(
  leadId: string,
  venueId: string
): Promise<AIScoringResult | null> {
  try {
    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('venue_id', venueId)
      .single();

    if (leadError || !lead) {
      console.error('Lead not found:', leadError);
      return null;
    }

    // Get conversation history
    const conversationHistory = await getLeadConversationHistory(leadId);

    // Get detailed AI scoring
    return await calculateDetailedAIScore(lead, conversationHistory);
  } catch (error) {
    console.error('Error getting detailed lead score:', error);
    return null;
  }
}

// Auto-update lead score when lead data changes
export async function handleLeadDataChange(
  leadId: string,
  venueId: string,
  changeType: 'created' | 'updated' | 'note_added' | 'status_changed' = 'updated'
): Promise<void> {
  try {
    console.log('Handling lead data change:', leadId, changeType);

    const eventMapping = {
      created: SCORING_EVENTS.LEAD_CREATED,
      updated: SCORING_EVENTS.SYSTEM_UPDATE,
      note_added: SCORING_EVENTS.MESSAGE_ADDED,
      status_changed: SCORING_EVENTS.MANUAL_UPDATE
    };

    await calculateAndUpdateLeadScore(
      leadId,
      venueId,
      'system',
      eventMapping[changeType]
    );
  } catch (error) {
    console.error('Error in handleLeadDataChange:', error);
    // Don't throw - this is a background operation
  }
}

// Helper function to get conversation history for a lead
async function getLeadConversationHistory(leadId: string): Promise<Array<{ content: string; timestamp?: string }>> {
  try {
    // Try to get conversation from lead's conversation_context
    const { data: lead } = await supabase
      .from('leads')
      .select('conversation_context')
      .eq('id', leadId)
      .single();

    if (lead?.conversation_context?.messages && Array.isArray(lead.conversation_context.messages)) {
      return lead.conversation_context.messages.map((msg: any) => ({
        content: msg.content || msg.message || String(msg),
        timestamp: msg.timestamp
      }));
    }

    // Fallback: try to get from lead_activities or other sources
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('description, created_at')
      .eq('lead_id', leadId)
      .eq('activity_type', 'message_added')
      .order('created_at', { ascending: true });

    if (activities && activities.length > 0) {
      return activities.map(activity => ({
        content: activity.description || '',
        timestamp: activity.created_at
      }));
    }

    return [];
  } catch (error) {
    console.warn('Could not get conversation history for lead:', leadId, error);
    return [];
  }
}

// Create scoring history record
async function createScoringHistoryRecord(data: {
  lead_id: string;
  venue_id: string;
  previous_score: number;
  new_score: number;
  score_change: number;
  trigger_event: string;
  triggered_by: string;
  method: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('lead_activities')
      .insert([{
        lead_id: data.lead_id,
        activity_type: 'score_updated',
        description: `Score updated from ${data.previous_score} to ${data.new_score} (${data.score_change >= 0 ? '+' : ''}${data.score_change}) using ${data.method}`,
        performed_by: null, // System update
        metadata: {
          previous_score: data.previous_score,
          new_score: data.new_score,
          score_change: data.score_change,
          trigger_event: data.trigger_event,
          triggered_by: data.triggered_by,
          method: data.method
        }
      }]);

    if (error) {
      console.error('Error creating scoring history record:', error);
    }
  } catch (error) {
    console.error('Error in createScoringHistoryRecord:', error);
  }
} 