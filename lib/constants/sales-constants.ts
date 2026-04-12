// ============================================
// SALES SYSTEM CONSTANTS
// ============================================

// Lead status options with descriptions
export const LEAD_STATUSES = {
  new: { 
    label: 'New', 
    description: 'Recently discovered lead, not yet contacted',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  researching: { 
    label: 'Researching', 
    description: 'Gathering information about the business',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  contacted: { 
    label: 'Contacted', 
    description: 'Initial contact made, awaiting response',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  qualified: { 
    label: 'Qualified', 
    description: 'Lead has shown interest and fits criteria',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  demo_scheduled: { 
    label: 'Demo Scheduled', 
    description: 'Product demonstration scheduled',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  proposal_sent: { 
    label: 'Proposal Sent', 
    description: 'Proposal or quote has been sent',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  negotiating: { 
    label: 'Negotiating', 
    description: 'In active negotiation or discussion',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  closed_won: { 
    label: 'Closed Won', 
    description: 'Successfully converted to customer',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  closed_lost: { 
    label: 'Closed Lost', 
    description: 'Lost opportunity, no longer pursuing',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  not_interested: { 
    label: 'Not Interested', 
    description: 'Lead expressed no interest',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
} as const;

// Lead priority options
export const LEAD_PRIORITIES = {
  low: {
    label: 'Low',
    description: 'Standard follow-up timeline',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    urgency: 'within 1 week',
  },
  medium: {
    label: 'Medium',
    description: 'Moderate priority for follow-up',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    urgency: 'within 2-3 days',
  },
  high: {
    label: 'High',
    description: 'High priority, contact soon',
    color: 'bg-red-100 text-red-800 border-red-200',
    urgency: 'within 24 hours',
  },
} as const;

// Activity types for sales activities
export const ACTIVITY_TYPES = {
  call: {
    label: 'Phone Call',
    icon: 'Phone',
    description: 'Telephone conversation',
    color: 'bg-green-100 text-green-800',
  },
  email: {
    label: 'Email',
    icon: 'Mail',
    description: 'Email communication',
    color: 'bg-blue-100 text-blue-800',
  },
  email_sent: {
    label: 'Email Sent',
    icon: 'Send',
    description: 'Email sent from platform',
    color: 'bg-indigo-100 text-indigo-800',
  },
  email_scheduled: {
    label: 'Email Scheduled',
    icon: 'Clock',
    description: 'Email scheduled for future sending',
    color: 'bg-purple-100 text-purple-800',
  },
  demo: {
    label: 'Demo',
    icon: 'Monitor',
    description: 'Product demonstration',
    color: 'bg-purple-100 text-purple-800',
  },
  proposal: {
    label: 'Proposal',
    icon: 'FileText',
    description: 'Proposal or quote sent',
    color: 'bg-orange-100 text-orange-800',
  },
  meeting: {
    label: 'Meeting',
    icon: 'Users',
    description: 'In-person or video meeting',
    color: 'bg-indigo-100 text-indigo-800',
  },
  note: {
    label: 'Note',
    icon: 'FileText',
    description: 'General note or observation',
    color: 'bg-gray-100 text-gray-800',
  },
  linkedin_connection: {
    label: 'LinkedIn',
    icon: 'Linkedin',
    description: 'LinkedIn connection or message',
    color: 'bg-blue-100 text-blue-800',
  },
  follow_up: {
    label: 'Follow Up',
    icon: 'Clock',
    description: 'Follow-up action required',
    color: 'bg-yellow-100 text-yellow-800',
  },
  research: {
    label: 'Research',
    icon: 'Search',
    description: 'Research activity',
    color: 'bg-purple-100 text-purple-800',
  },
  sequence_created: {
    label: 'Sequence Created',
    icon: 'ListPlus',
    description: 'A new email sequence was created',
    color: 'bg-teal-100 text-teal-800',
  },
  sequence_updated: {
    label: 'Sequence Updated',
    icon: 'ListChecks',
    description: 'An email sequence was updated',
    color: 'bg-sky-100 text-sky-800',
  },
  sequence_enrolled: {
    label: 'Enrolled in Sequence',
    icon: 'LogIn',
    description: 'A lead was enrolled in an email sequence',
    color: 'bg-green-100 text-green-800',
  },
  sequence_stopped: {
    label: 'Sequence Stopped',
    icon: 'LogOut',
    description: 'A lead was removed from a sequence',
    color: 'bg-red-100 text-red-800',
  },
  sequence_completed: {
    label: 'Sequence Completed',
    icon: 'CheckCircle2',
    description: 'A lead has completed an email sequence',
    color: 'bg-blue-100 text-blue-800',
  },
} as const;

// Email sequence step types
export const SEQUENCE_EMAIL_TYPES = {
  sales_outreach: {
    label: 'Sales Outreach',
    description: 'Initial sales contact email',
    color: 'bg-blue-100 text-blue-800',
  },
  follow_up: {
    label: 'Follow-up',
    description: 'Follow-up email after initial contact',
    color: 'bg-green-100 text-green-800',
  },
  proposal: {
    label: 'Proposal',
    description: 'Proposal or quote email',
    color: 'bg-purple-100 text-purple-800',
  },
  custom: {
    label: 'Custom',
    description: 'Custom email type',
    color: 'bg-gray-100 text-gray-800',
  },
} as const;

// Business status options for venue leads
export const BUSINESS_STATUSES = {
  OPERATIONAL: {
    label: 'Operational',
    description: 'Business is currently operating',
    color: 'bg-green-100 text-green-800',
  },
  CLOSED_TEMPORARILY: {
    label: 'Temporarily Closed',
    description: 'Business is temporarily closed',
    color: 'bg-yellow-100 text-yellow-800',
  },
  CLOSED_PERMANENTLY: {
    label: 'Permanently Closed',
    description: 'Business has permanently closed',
    color: 'bg-red-100 text-red-800',
  },
} as const;

// Lead score categories
export const LEAD_SCORE_CATEGORIES = {
  hot: {
    label: 'Hot',
    range: '80-100',
    description: 'Excellent potential, contact immediately',
    color: 'bg-red-100 text-red-800 border-red-200',
    priority: 'immediate',
  },
  warm: {
    label: 'Warm',
    range: '60-79',
    description: 'Good potential, contact within 24 hours',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    priority: 'high',
  },
  cold: {
    label: 'Cold',
    range: '40-59',
    description: 'Moderate potential, qualify first',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    priority: 'medium',
  },
  poor: {
    label: 'Poor',
    range: '0-39',
    description: 'Low potential, deprioritise',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    priority: 'low',
  },
} as const;

// Default pagination settings
export const PAGINATION_DEFAULTS = {
  limit: 50,
  maxLimit: 100,
  defaultPage: 1,
} as const;

// Contact attempt recommendations
export const CONTACT_ATTEMPT_GUIDELINES = {
  initial: 'Make first contact within 24 hours of lead creation',
  followUp1: 'First follow-up after 2-3 days if no response',
  followUp2: 'Second follow-up after 1 week',
  followUp3: 'Final follow-up after 2 weeks',
  giveUp: 'Consider lead cold after 3 failed attempts',
} as const;

// Export types for use in components
export type LeadStatus = keyof typeof LEAD_STATUSES;
export type LeadPriority = keyof typeof LEAD_PRIORITIES;
export type ActivityType = keyof typeof ACTIVITY_TYPES;
export type SequenceEmailType = keyof typeof SEQUENCE_EMAIL_TYPES;
export type BusinessStatus = keyof typeof BUSINESS_STATUSES;
export type LeadScoreCategory = keyof typeof LEAD_SCORE_CATEGORIES;

// Email Enrichment Constants
export const EMAIL_ENRICHMENT = {
  CONFIDENCE_LEVELS: {
    HIGH: 'high' as const,
    MEDIUM: 'medium' as const,
    LOW: 'low' as const,
  },
  CONFIDENCE_COLORS: {
    high: 'text-green-600',
    medium: 'text-yellow-600', 
    low: 'text-red-600',
  },
  CONFIDENCE_LABELS: {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence',
  },
  MAX_CANDIDATES: 10,
  SEARCH_TIMEOUT: 30000, // 30 seconds
} as const;

// Email Validation
export const EMAIL_PATTERNS = {
  COMMON_DOMAINS: [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
  ],
  BUSINESS_EMAIL_PREFIXES: [
    'info',
    'contact',
    'hello',
    'enquiries',
    'admin',
    'support',
    'sales',
    'manager',
    'reception',
    'membership',
  ],
  DOMAIN_EXTRACTION_REGEX: /^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i,
} as const;

// Search Query Templates
export const EMAIL_SEARCH_TEMPLATES = {
  PRIMARY: '{venueName} {domain} contact email',
  ALTERNATIVE: '{venueName} fitness venue contact information email',
  SPECIFIC: '{venueName} fitness centre email address contact',
  SOCIAL: '{venueName} fitness venue facebook instagram contact email',
} as const; 