import { openAIService } from '@/lib/openai-service';
import { Lead, ConversationMessage } from '@/lib/types';
import { DEFAULT_AI_SCORING_PROMPT } from '@/lib/constants/lead-constants';

export interface AIScoringResult {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  method: 'ai' | 'fallback';
  reasoning?: string;
}

// Calculate AI-powered lead score
export async function calculateAILeadScore(
  lead: Lead,
  conversationHistory: ConversationMessage[],
  customPrompt?: string
): Promise<number> {
  try {
    console.log('Calculating AI lead score for lead:', lead.id);
    
    const result = await calculateDetailedAILeadScore(lead, conversationHistory, customPrompt);
    
    console.log('AI lead score calculated:', {
      leadId: lead.id,
      score: result.score,
      method: result.method,
      confidence: result.confidence
    });
    
    return result.score;
  } catch (error) {
    console.error('Error calculating AI lead score:', error);
    return calculateFallbackScore(lead, conversationHistory);
  }
}

// Calculate detailed AI lead score with metadata
export async function calculateDetailedAILeadScore(
  lead: Lead,
  conversationHistory: ConversationMessage[],
  customPrompt?: string
): Promise<AIScoringResult> {
  try {
    const prompt = customPrompt || DEFAULT_AI_SCORING_PROMPT;
    
    // Build conversation context
    const conversationText = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const leadContext = buildLeadContext(lead, conversationText);

    const response = await openAIService.createChatCompletion({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: leadContext }
      ],
      temperature: 0.3, // Consistent scoring
      max_tokens: 10
    });

    const scoreText = response.choices[0]?.message?.content?.trim();
    
    // Extract numeric score from various possible formats
    let score = 0;
    if (scoreText) {
      // Try to extract number from formats like:
      // "85", "85/100", "Score: 85", "**85/100**", "Lead Score: **55/100**"
      const scoreMatch = scoreText.match(/(\d+)(?:\/100)?/);
      if (scoreMatch && scoreMatch[1]) {
        score = parseInt(scoreMatch[1]);
      }
    }
    
    // Validate score is within bounds
    if (isNaN(score) || score < 0 || score > 100) {
      console.warn(`Invalid AI score received: ${scoreText}, using fallback`);
      return {
        score: calculateFallbackScore(lead, conversationHistory),
        confidence: 'low',
        method: 'fallback',
        reasoning: `Invalid AI response: ${scoreText}`
      };
    }
    
    return {
      score,
      confidence: determineConfidence(lead, conversationHistory, score),
      method: 'ai',
      reasoning: `AI scored based on conversation analysis`
    };
  } catch (error) {
    console.error('Error in AI scoring:', error);
    
    return {
      score: calculateFallbackScore(lead, conversationHistory),
      confidence: 'low',
      method: 'fallback',
      reasoning: `AI service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Build structured lead context for AI analysis
function buildLeadContext(lead: Lead, conversationText: string): string {
  return `
Lead Information:
- Name: ${lead.visitor_name || 'Not provided'}
- Email: ${lead.visitor_email || 'Not provided'}
- Phone: ${lead.visitor_phone || 'Not provided'}
- Interest Level: ${lead.interest_level || 'unknown'}
- Source: ${lead.chatbot_type || 'unknown'} chatbot
- Created: ${new Date(lead.created_at).toLocaleString()}
- Current Status: ${lead.lead_status}
- Previous Score: ${lead.lead_score || 0}

Conversation History:
${conversationText || 'No conversation history available'}

Additional Context:
- Notes: ${lead.lead_notes || 'None'}
- Interests: ${lead.interests?.join(', ') || 'None specified'}
- UTM Source: ${lead.utm_source || 'None'}
- Page URL: ${lead.page_url || 'None'}`.trim();
}

// Calculate fallback score using simple algorithmic approach
function calculateFallbackScore(lead: Lead, conversationHistory: ConversationMessage[]): number {
  let score = 20; // Base score
  
  // Contact information scoring
  if (lead.visitor_email) score += 20;
  if (lead.visitor_phone) score += 15;
  if (lead.visitor_name && lead.visitor_name.trim().split(' ').length >= 2) score += 5;
  
  // Interest level scoring
  switch (lead.interest_level) {
    case 'high':
      score += 25;
      break;
    case 'medium':
      score += 15;
      break;
    case 'low':
      score += 5;
      break;
  }
  
  // Conversation engagement scoring
  const messageCount = conversationHistory.length;
  if (messageCount >= 10) score += 20;
  else if (messageCount >= 6) score += 15;
  else if (messageCount >= 3) score += 10;
  else score += 5;
  
  // Source bonus
  if (lead.chatbot_type === 'tour') score += 5;
  
  // Notes bonus
  if (lead.lead_notes && lead.lead_notes.length > 50) score += 3;
  
  return Math.min(Math.max(score, 0), 100);
}

// Determine confidence level based on available data
function determineConfidence(
  lead: Lead, 
  conversationHistory: ConversationMessage[], 
  score: number
): 'high' | 'medium' | 'low' {
  let confidencePoints = 0;
  
  // Data completeness factors
  if (lead.visitor_email) confidencePoints += 2;
  if (lead.visitor_phone) confidencePoints += 2;
  if (lead.visitor_name) confidencePoints += 1;
  if (lead.interest_level) confidencePoints += 2;
  
  // Conversation quality factors
  if (conversationHistory.length >= 5) confidencePoints += 2;
  if (conversationHistory.length >= 10) confidencePoints += 1;
  
  // Score consistency factors
  if (score > 0 && score <= 100) confidencePoints += 1;
  
  if (confidencePoints >= 7) return 'high';
  if (confidencePoints >= 4) return 'medium';
  return 'low';
}

// Validate AI scoring prompt
export async function validateScoringPrompt(prompt: string): Promise<{ valid: boolean; error?: string }> {
  if (!prompt.trim()) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }
  
  if (prompt.length > 2000) {
    return { valid: false, error: 'Prompt must be under 2000 characters' };
  }
  
  if (prompt.length < 50) {
    return { valid: false, error: 'Prompt must be at least 50 characters' };
  }
  
  // Check if prompt mentions scoring out of 100
  if (!prompt.toLowerCase().includes('100')) {
    return { valid: false, error: 'Prompt should mention scoring out of 100' };
  }
  
  // Check for potential injection attempts
  const suspiciousPatterns = [
    'ignore previous',
    'forget instructions',
    'system:',
    'assistant:',
    '```',
    '<script>',
    'javascript:'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  for (const pattern of suspiciousPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return { valid: false, error: `Prompt contains potentially harmful content: ${pattern}` };
    }
  }
  
  return { valid: true };
}

// Test AI scoring with sample data
export async function testAIScoring(
  prompt: string,
  sampleLead?: Partial<Lead>,
  sampleConversation?: ConversationMessage[]
): Promise<AIScoringResult> {
  const testLead: Lead = {
    id: 'test-lead',
    venue_id: 'test-venue',
    visitor_name: sampleLead?.visitor_name || 'John Smith',
    visitor_email: sampleLead?.visitor_email || 'john@example.com',
    visitor_phone: sampleLead?.visitor_phone || '+44 7123 456789',
    interest_level: sampleLead?.interest_level || 'medium',
    chatbot_type: sampleLead?.chatbot_type || 'tour',
    lead_status: 'new',
    lead_score: 0,
    source: 'chatbot',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const testConversation: ConversationMessage[] = sampleConversation || [
    { role: 'user', content: 'Hi, I\'m interested in joining your venue' },
    { role: 'assistant', content: 'Great! I\'d love to help you find the perfect membership. What are your fitness goals?' },
    { role: 'user', content: 'I want to lose weight and get stronger. What are your prices?' },
    { role: 'assistant', content: 'We have several membership options. Would you like to schedule a tour to see our facilities?' },
    { role: 'user', content: 'Yes, that sounds good. When are you available?' }
  ];
  
  return await calculateDetailedAILeadScore(testLead, testConversation, prompt);
} 