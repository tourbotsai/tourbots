// Conversation analysis utilities for lead capture
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationInsights {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  conversationDuration: number; // in minutes
  averageMessageLength: number;
  engagementScore: number; // 0-100
  sentimentScore: number; // -1 to 1
  topicCategories: string[];
  detectedIntents: string[];
  keyPhrases: string[];
  interestLevel: 'high' | 'medium' | 'low';
  buyingSignals: string[];
  concerns: string[];
  questions: string[];
}

export interface ConversationContext {
  sessionId: string;
  conversationId: string;
  venueId: string;
  chatbotType: 'tour';
  messages: ChatMessage[];
  userAgent?: string;
  ipAddress?: string;
  pageUrl?: string;
  startTime: string;
  lastActivity: string;
}

// Intent detection patterns
const INTENT_PATTERNS = {
  pricing: [
    'how much', 'price', 'cost', 'fee', 'expensive', 'cheap', 'rates', 'pricing',
    'membership cost', 'monthly fee', 'annual cost', 'what does it cost'
  ],
  membership: [
    'join', 'member', 'membership', 'sign up', 'register', 'become a member',
    'how to join', 'joining process', 'membership options'
  ],
  tour_booking: [
    'tour', 'visit', 'see', 'look around', 'show me', 'book', 'appointment',
    'come in', 'check out', 'have a look'
  ],
  class_inquiry: [
    'class', 'classes', 'session', 'training', 'workout', 'schedule',
    'timetable', 'when', 'what time'
  ],
  facilities: [
    'equipment', 'fitness venue', 'pool', 'sauna', 'changing rooms', 'facilities',
    'what do you have', 'available'
  ],
  personal_training: [
    'personal trainer', 'pt', 'one-on-one', 'personal training', 'trainer',
    'individual training'
  ],
  contact: [
    'contact', 'phone', 'email', 'address', 'location', 'how to reach',
    'get in touch'
  ]
};

// Buying signal patterns
const BUYING_SIGNALS = [
  'ready to join', 'want to sign up', 'interested in joining', 'sounds good',
  'when can i start', 'how do i join', 'definitely interested', 'count me in',
  'i want to', 'looking to join', 'ready to commit', 'sounds perfect'
];

// Concern patterns
const CONCERN_PATTERNS = [
  'worried', 'concerned', 'not sure', 'hesitant', 'expensive', 'too much',
  'think about it', 'need to consider', 'discuss with', 'budget', 'afford'
];

// Interest level keywords
const HIGH_INTEREST_KEYWORDS = [
  'definitely', 'absolutely', 'perfect', 'exactly', 'ideal', 'love',
  'excited', 'ready', 'want', 'need', 'looking for'
];

const LOW_INTEREST_KEYWORDS = [
  'maybe', 'perhaps', 'not sure', 'think about', 'consider', 'later',
  'busy', 'no time', 'not ready', 'expensive'
];

// Extract conversation insights
export function analyseConversation(messages: ChatMessage[]): ConversationInsights {
  if (messages.length === 0) {
    return getEmptyInsights();
  }

  const userMessages = messages.filter(msg => msg.role === 'user');
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  
  const conversationDuration = calculateConversationDuration(messages);
  const averageMessageLength = calculateAverageMessageLength(userMessages);
  const engagementScore = calculateEngagementScore(messages);
  const sentimentScore = analyseSentiment(userMessages);
  const topicCategories = extractTopicCategories(userMessages);
  const detectedIntents = detectIntents(userMessages);
  const keyPhrases = extractKeyPhrases(userMessages);
  const interestLevel = determineInterestLevel(userMessages);
  const buyingSignals = detectBuyingSignals(userMessages);
  const concerns = detectConcerns(userMessages);
  const questions = extractQuestions(userMessages);

  return {
    totalMessages: messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    conversationDuration,
    averageMessageLength,
    engagementScore,
    sentimentScore,
    topicCategories,
    detectedIntents,
    keyPhrases,
    interestLevel,
    buyingSignals,
    concerns,
    questions
  };
}

function getEmptyInsights(): ConversationInsights {
  return {
    totalMessages: 0,
    userMessages: 0,
    assistantMessages: 0,
    conversationDuration: 0,
    averageMessageLength: 0,
    engagementScore: 0,
    sentimentScore: 0,
    topicCategories: [],
    detectedIntents: [],
    keyPhrases: [],
    interestLevel: 'low',
    buyingSignals: [],
    concerns: [],
    questions: []
  };
}

// Calculate conversation duration in minutes
function calculateConversationDuration(messages: ChatMessage[]): number {
  if (messages.length < 2) return 0;
  
  const firstMessage = new Date(messages[0].timestamp);
  const lastMessage = new Date(messages[messages.length - 1].timestamp);
  
  return Math.round((lastMessage.getTime() - firstMessage.getTime()) / (1000 * 60));
}

// Calculate average message length for user messages
function calculateAverageMessageLength(userMessages: ChatMessage[]): number {
  if (userMessages.length === 0) return 0;
  
  const totalLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0);
  return Math.round(totalLength / userMessages.length);
}

// Calculate engagement score (0-100)
function calculateEngagementScore(messages: ChatMessage[]): number {
  let score = 0;
  
  // Base score from message count
  score += Math.min(messages.length * 5, 30);
  
  // Bonus for longer conversation
  if (messages.length >= 10) score += 20;
  if (messages.length >= 20) score += 20;
  
  // Bonus for detailed user messages
  const userMessages = messages.filter(msg => msg.role === 'user');
  const detailedMessages = userMessages.filter(msg => msg.content.length > 50);
  score += Math.min(detailedMessages.length * 5, 20);
  
  // Bonus for questions from user
  const questions = userMessages.filter(msg => msg.content.includes('?'));
  score += Math.min(questions.length * 3, 10);
  
  return Math.min(score, 100);
}

// Simple sentiment analysis (-1 to 1)
function analyseSentiment(userMessages: ChatMessage[]): number {
  if (userMessages.length === 0) return 0;
  
  const positiveWords = [
    'good', 'great', 'excellent', 'perfect', 'love', 'like', 'amazing',
    'fantastic', 'wonderful', 'awesome', 'brilliant', 'interested', 'excited'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'dislike', 'expensive', 'worried',
    'concerned', 'disappointed', 'frustrated', 'annoyed', 'upset'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  let totalWords = 0;
  
  userMessages.forEach(msg => {
    const words = msg.content.toLowerCase().split(/\s+/);
    totalWords += words.length;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
  });
  
  if (totalWords === 0) return 0;
  
  const positiveRatio = positiveCount / totalWords;
  const negativeRatio = negativeCount / totalWords;
  
  return Math.max(-1, Math.min(1, (positiveRatio - negativeRatio) * 10));
}

// Extract topic categories from conversation
function extractTopicCategories(userMessages: ChatMessage[]): string[] {
  const categories = new Set<string>();
  const conversationText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  const topicKeywords = {
    fitness: ['workout', 'exercise', 'fitness', 'training', 'fitness venue'],
    classes: ['class', 'classes', 'group', 'session', 'yoga', 'pilates'],
    equipment: ['equipment', 'machines', 'weights', 'cardio', 'treadmill'],
    swimming: ['pool', 'swimming', 'swim', 'aqua'],
    membership: ['membership', 'join', 'member', 'sign up'],
    pricing: ['price', 'cost', 'fee', 'expensive', 'cheap', 'rates'],
    facilities: ['facilities', 'changing rooms', 'sauna', 'parking'],
    personal_training: ['personal trainer', 'pt', 'one-on-one']
  };
  
  Object.entries(topicKeywords).forEach(([category, keywords]) => {
    if (keywords.some(keyword => conversationText.includes(keyword))) {
      categories.add(category);
    }
  });
  
  return Array.from(categories);
}

// Detect user intents
function detectIntents(userMessages: ChatMessage[]): string[] {
  const intents = new Set<string>();
  const conversationText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  Object.entries(INTENT_PATTERNS).forEach(([intent, patterns]) => {
    if (patterns.some(pattern => conversationText.includes(pattern))) {
      intents.add(intent);
    }
  });
  
  return Array.from(intents);
}

// Extract key phrases from conversation
function extractKeyPhrases(userMessages: ChatMessage[]): string[] {
  const phrases = new Set<string>();
  
  userMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    
    // Extract phrases that might indicate specific interests
    const interestPhrases = [
      'lose weight', 'build muscle', 'get fit', 'stay healthy', 'improve fitness',
      'personal trainer', 'group classes', 'swimming pool', 'fitness equipment',
      'flexible membership', 'no contract', 'student discount', 'family membership'
    ];
    
    interestPhrases.forEach(phrase => {
      if (content.includes(phrase)) {
        phrases.add(phrase);
      }
    });
    
    // Extract questions as key phrases
    const sentences = content.split(/[.!?]+/);
    sentences.forEach(sentence => {
      if (sentence.includes('?') || sentence.startsWith('how') || sentence.startsWith('what') || sentence.startsWith('when')) {
        const cleanSentence = sentence.trim().replace(/[^\w\s]/g, '');
        if (cleanSentence.length > 10 && cleanSentence.length < 100) {
          phrases.add(cleanSentence);
        }
      }
    });
  });
  
  return Array.from(phrases).slice(0, 10); // Limit to top 10 phrases
}

// Determine overall interest level
function determineInterestLevel(userMessages: ChatMessage[]): 'high' | 'medium' | 'low' {
  const conversationText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  let highScore = 0;
  let lowScore = 0;
  
  HIGH_INTEREST_KEYWORDS.forEach(keyword => {
    if (conversationText.includes(keyword)) highScore++;
  });
  
  LOW_INTEREST_KEYWORDS.forEach(keyword => {
    if (conversationText.includes(keyword)) lowScore++;
  });
  
  // Check for specific high-interest indicators
  if (BUYING_SIGNALS.some(signal => conversationText.includes(signal))) {
    highScore += 3;
  }
  
  // Check for concerns that might lower interest
  if (CONCERN_PATTERNS.some(concern => conversationText.includes(concern))) {
    lowScore += 2;
  }
  
  // Consider message count and engagement
  if (userMessages.length >= 8) highScore++;
  if (userMessages.length <= 3) lowScore++;
  
  if (highScore >= 3) return 'high';
  if (lowScore >= 3) return 'low';
  return 'medium';
}

// Detect buying signals
function detectBuyingSignals(userMessages: ChatMessage[]): string[] {
  const signals: string[] = [];
  const conversationText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  BUYING_SIGNALS.forEach(signal => {
    if (conversationText.includes(signal)) {
      signals.push(signal);
    }
  });
  
  return signals;
}

// Detect concerns or objections
function detectConcerns(userMessages: ChatMessage[]): string[] {
  const concerns: string[] = [];
  const conversationText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');
  
  CONCERN_PATTERNS.forEach(concern => {
    if (conversationText.includes(concern)) {
      concerns.push(concern);
    }
  });
  
  return concerns;
}

// Extract questions from user messages
function extractQuestions(userMessages: ChatMessage[]): string[] {
  const questions: string[] = [];
  
  userMessages.forEach(msg => {
    const sentences = msg.content.split(/[.!?]+/);
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.includes('?') || 
          trimmed.toLowerCase().startsWith('how') ||
          trimmed.toLowerCase().startsWith('what') ||
          trimmed.toLowerCase().startsWith('when') ||
          trimmed.toLowerCase().startsWith('where') ||
          trimmed.toLowerCase().startsWith('why') ||
          trimmed.toLowerCase().startsWith('can')) {
        if (trimmed.length > 5) {
          questions.push(trimmed);
        }
      }
    });
  });
  
  return questions.slice(0, 5); // Limit to 5 most recent questions
}

// Check if conversation has enough context for lead capture
export function hasEnoughContextForCapture(messages: ChatMessage[]): boolean {
  if (messages.length < 3) return false;
  
  const userMessages = messages.filter(msg => msg.role === 'user');
  if (userMessages.length < 2) return false;
  
  const totalUserContent = userMessages.map(msg => msg.content).join(' ');
  if (totalUserContent.length < 50) return false;
  
  return true;
}

// Determine if conversation shows high purchase intent
export function hasHighPurchaseIntent(insights: ConversationInsights): boolean {
  // High interest level
  if (insights.interestLevel === 'high') return true;
  
  // Multiple buying signals
  if (insights.buyingSignals.length >= 2) return true;
  
  // High engagement with pricing/membership intents
  if (insights.engagementScore >= 70 && 
      (insights.detectedIntents.includes('pricing') || insights.detectedIntents.includes('membership'))) {
    return true;
  }
  
  // Positive sentiment with membership intent
  if (insights.sentimentScore > 0.3 && insights.detectedIntents.includes('membership')) {
    return true;
  }
  
  return false;
}

// Generate conversation summary for lead notes
export function generateConversationSummary(insights: ConversationInsights, messages: ChatMessage[]): string {
  const userMessages = messages.filter(msg => msg.role === 'user');
  const summary: string[] = [];
  
  // Basic conversation info
  summary.push(`${insights.totalMessages} message conversation (${insights.conversationDuration} minutes)`);
  
  // Interest level and sentiment
  summary.push(`Interest level: ${insights.interestLevel}, Sentiment: ${insights.sentimentScore > 0 ? 'positive' : insights.sentimentScore < 0 ? 'negative' : 'neutral'}`);
  
  // Main topics discussed
  if (insights.topicCategories.length > 0) {
    summary.push(`Topics: ${insights.topicCategories.join(', ')}`);
  }
  
  // Key intents
  if (insights.detectedIntents.length > 0) {
    summary.push(`Interested in: ${insights.detectedIntents.join(', ')}`);
  }
  
  // Buying signals
  if (insights.buyingSignals.length > 0) {
    summary.push(`Buying signals: ${insights.buyingSignals.slice(0, 3).join(', ')}`);
  }
  
  // Concerns
  if (insights.concerns.length > 0) {
    summary.push(`Concerns: ${insights.concerns.slice(0, 3).join(', ')}`);
  }
  
  // Key questions
  if (insights.questions.length > 0) {
    summary.push(`Key questions: ${insights.questions.slice(0, 2).join('; ')}`);
  }
  
  return summary.join('. ');
}

// Extract interests for lead data
export function extractInterests(insights: ConversationInsights): string[] {
  const interests = new Set<string>();
  
  // Map topic categories to interests
  const topicMapping = {
    'personal_training': 'personal_training',
    'classes': 'group_classes',
    'equipment': 'weights',
    'swimming': 'swimming',
    'fitness': 'general_fitness'
  };
  
  insights.topicCategories.forEach(category => {
    const interest = topicMapping[category as keyof typeof topicMapping];
    if (interest) interests.add(interest);
  });
  
  // Add interests based on key phrases
  insights.keyPhrases.forEach(phrase => {
    if (phrase.includes('lose weight') || phrase.includes('weight loss')) {
      interests.add('weight_loss');
    }
    if (phrase.includes('build muscle') || phrase.includes('muscle')) {
      interests.add('muscle_gain');
    }
    if (phrase.includes('cardio') || phrase.includes('running')) {
      interests.add('cardio');
    }
    if (phrase.includes('flexibility') || phrase.includes('stretch')) {
      interests.add('flexibility');
    }
  });
  
  return Array.from(interests);
}

// Calculate conversation quality score
export function calculateConversationQuality(insights: ConversationInsights): number {
  let score = 0;
  
  // Message count (max 20 points)
  score += Math.min(insights.totalMessages * 2, 20);
  
  // Duration (max 15 points)
  score += Math.min(insights.conversationDuration * 2, 15);
  
  // Engagement (max 25 points)
  score += insights.engagementScore * 0.25;
  
  // Intent detection (max 20 points)
  score += Math.min(insights.detectedIntents.length * 5, 20);
  
  // Interest level (max 20 points)
  if (insights.interestLevel === 'high') score += 20;
  else if (insights.interestLevel === 'medium') score += 10;
  
  return Math.min(Math.round(score), 100);
} 