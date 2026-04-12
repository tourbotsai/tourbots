// Lead-related constants and configurations

// Lead status options
export const LEAD_STATUSES = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  LOST: 'lost'
} as const;

export type LeadStatus = typeof LEAD_STATUSES[keyof typeof LEAD_STATUSES];

// Interest level options
export const INTEREST_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export type InterestLevel = typeof INTEREST_LEVELS[keyof typeof INTEREST_LEVELS];

// Lead sources
export const LEAD_SOURCES = {
  CHATBOT: 'chatbot',
  TOUR: 'tour',
  CONTACT_FORM: 'contact_form',
  MANUAL: 'manual'
} as const;

export type LeadSource = typeof LEAD_SOURCES[keyof typeof LEAD_SOURCES];

// Chatbot types
export const CHATBOT_TYPES = {
  TOUR: 'tour',
} as const;

export type ChatbotType = typeof CHATBOT_TYPES[keyof typeof CHATBOT_TYPES];

// Activity types
export const ACTIVITY_TYPES = {
  STATUS_CHANGE: 'status_change',
  NOTE_ADDED: 'note_added',
  CONTACTED: 'contacted',
  EMAIL_SENT: 'email_sent',
  CALL_MADE: 'call_made',
  MEETING_SCHEDULED: 'meeting_scheduled',
  FOLLOW_UP_SET: 'follow_up_set'
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

// AI Scoring Configuration
export const DEFAULT_AI_SCORING_PROMPT = `Score this lead out of 100 based on their conversation with our AI chatbot. Consider: 1) Level of interest shown, 2) Engagement quality, 3) Intent to join/purchase, 4) Urgency indicators, 5) Contact information completeness, 6) SENTIMENT - negative comments like "rubbish", "overpriced", "shit", "terrible" should heavily reduce the score. A score of 80+ indicates a hot lead ready to convert (enthusiastic, positive language), 60-79 is warm with strong potential, 40-59 is medium requiring nurturing, 20-39 is cold with complaints/objections, below 20 is hostile/negative. If they complain but still ask for pricing, score around 25-35. If they say its amazing/best ever, give them 95-100.`;

// Lead scoring weights
export const LEAD_SCORING_WEIGHTS = {
  INTEREST_LEVEL: {
    high: 50,
    medium: 30,
    low: 10
  },
  CONVERSATION_ENGAGEMENT: {
    max_points: 30,
    points_per_message: 2
  },
  SPECIFIC_INTERESTS: {
    points_per_interest: 5,
    max_points: 25
  },
  RECENCY: {
    max_points: 20,
    decay_hours: 24
  },
  BUYING_SIGNALS: {
    points_per_signal: 10,
    max_points: 30
  }
} as const;

// ============================================
// COMPREHENSIVE LEAD SCORING CONFIGURATION
// ============================================

// Main scoring weights used in detailed calculations
export const SCORING_WEIGHTS = {
  contact: {
    phone: 15,
    email: 15,
    website: 10,
  },
  business: {
    rating_per_star: 6, // 5 stars = 30 points
    reviews_per_10: 1, // max 20 points
    good_rating_bonus: 5, // 4.0+ rating
    many_reviews_bonus: 5, // 50+ reviews
  },
  engagement: {
    contacted: 5,
    responded: 10,
    demo_scheduled: 15,
    proposal_sent: 20,
  },
  negative: {
    not_interested: -50,
    closed_lost: -25,
    bounced_email: -10,
    no_response: -5,
  },
} as const;

// Lead category thresholds based on total score
export const LEAD_CATEGORY_THRESHOLDS = {
  HOT: 80,        // High priority - contact immediately
  WARM: 60,       // Medium priority - contact within 24 hours
  COLD: 40,       // Low priority - qualify before contacting
  POOR: 0         // Poor lead quality - consider deprioritising
} as const;

// Business quality assessment thresholds
export const BUSINESS_QUALITY_THRESHOLDS = {
  RATING: {
    EXCELLENT: 4.0,     // Good rating bonus threshold
    POOR: 3.5           // Below this = negative adjustment
  },
  REVIEWS: {
    MANY: 50,           // Many reviews bonus threshold
    ESTABLISHED: 100    // Well-established business threshold
  }
} as const;

// Contact attempt thresholds for warnings and penalties
export const CONTACT_ATTEMPT_THRESHOLDS = {
  MULTIPLE_WARNING: 3,    // Recommend alternative contact methods
  FAILED_PENALTY: 5       // Apply penalty for too many failed attempts
} as const;

// Place scoring potential categories
export const PLACE_POTENTIAL_THRESHOLDS = {
  EXCELLENT: 75,
  GOOD: 55,
  FAIR: 35,
  POOR: 0
} as const;

// Next action priority thresholds based on lead score
export const NEXT_ACTION_THRESHOLDS = {
  IMMEDIATE: 80,      // Call immediately
  HIGH_PRIORITY: 60,  // Research and prepare approach
  MEDIUM_PRIORITY: 0  // Email introduction
} as const;

// Conversion probability base values and adjustments
export const CONVERSION_PROBABILITY_CONFIG = {
  BASE_PROBABILITY: 0.1,          // 10% baseline
  CONTACT_BOOSTS: {
    phone: 0.15,                  // +15% for phone contact
    website: 0.1,                 // +10% for website presence
    email: 0.1                    // +10% for email contact
  },
  RATING_ADJUSTMENTS: {
    excellent_boost: 0.2,         // +20% for 4.0+ rating
    poor_penalty: -0.1            // -10% for <3.5 rating
  },
  REVIEW_ADJUSTMENTS: {
    established_boost: 0.15       // +15% for 100+ reviews
  },
  STATUS_MULTIPLIERS: {
    qualified: 0.3,               // +30% for qualified leads
    demo_scheduled: 0.5,          // +50% for demo scheduled
    proposal_sent: 0.4,           // +40% for proposal sent
    not_interested: 0.02,         // Reset to 2% if not interested
    closed_lost: 0.01             // Reset to 1% if previously lost
  },
  ATTEMPT_PENALTIES: {
    failed_attempts: -0.2         // -20% for 5+ failed attempts
  },
  PRIORITY_ADJUSTMENTS: {
    high: 0.1,                    // +10% for high priority leads
    low: -0.05                    // -5% for low priority leads
  },
  BOUNDS: {
    minimum: 0.01,                // 1% minimum probability
    maximum: 0.95                 // 95% maximum probability
  }
} as const;

// Conversion confidence thresholds
export const CONVERSION_CONFIDENCE_THRESHOLDS = {
  HIGH_CONFIDENCE: {
    min_positive_factors: 4,
    max_negative_factors: 1
  },
  MEDIUM_CONFIDENCE: {
    min_positive_factors: 2
  }
} as const;

// Valid interests
export const VALID_INTERESTS = [
  'personal_training',
  'group_classes',
  'cardio',
  'weights',
  'swimming',
  'nutrition',
  'flexibility',
  'weight_loss',
  'muscle_gain',
  'general_fitness',
  'sports_specific',
  'rehabilitation',
  'senior_fitness',
  'youth_programs'
] as const;

export type ValidInterest = typeof VALID_INTERESTS[number];

// Interest categories for grouping
export const INTEREST_CATEGORIES = {
  FITNESS_GOALS: ['weight_loss', 'muscle_gain', 'general_fitness', 'sports_specific'],
  TRAINING_TYPES: ['personal_training', 'group_classes', 'cardio', 'weights'],
  SPECIALITY: ['swimming', 'nutrition', 'flexibility', 'rehabilitation'],
  DEMOGRAPHICS: ['senior_fitness', 'youth_programs']
} as const;

// Buying signal patterns
export const BUYING_SIGNALS = [
  'ready to join',
  'want to sign up',
  'interested in joining',
  'sounds good',
  'when can i start',
  'how do i join',
  'definitely interested',
  'count me in',
  'i want to',
  'looking to join',
  'ready to commit',
  'sounds perfect'
] as const;

// Lead status transitions
export const VALID_STATUS_TRANSITIONS = {
  [LEAD_STATUSES.NEW]: [LEAD_STATUSES.CONTACTED, LEAD_STATUSES.QUALIFIED, LEAD_STATUSES.LOST],
  [LEAD_STATUSES.CONTACTED]: [LEAD_STATUSES.QUALIFIED, LEAD_STATUSES.CONVERTED, LEAD_STATUSES.LOST],
  [LEAD_STATUSES.QUALIFIED]: [LEAD_STATUSES.CONVERTED, LEAD_STATUSES.LOST, LEAD_STATUSES.CONTACTED],
  [LEAD_STATUSES.CONVERTED]: [], // Final state
  [LEAD_STATUSES.LOST]: [LEAD_STATUSES.CONTACTED] // Can be re-engaged
} as const;

// Lead score thresholds
export const LEAD_SCORE_THRESHOLDS = {
  HIGH_QUALITY: 85,
  MEDIUM_QUALITY: 65,
  LOW_QUALITY: 45,
  POOR_QUALITY: 25
} as const;

// Lead performance analysis thresholds
export const LEAD_PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME: {
    EXCELLENT: 24, // hours
    GOOD: 48,
    FAIR: 72
  },
  FOLLOW_UP_RATE: {
    EXCELLENT: 90, // percentage
    GOOD: 70,
    FAIR: 50
  },
  LEAD_SCORE_RATING: {
    EXCELLENT: 80,
    GOOD: 60,
    FAIR: 40
  },
  CONVERSION_RATE: {
    EXCELLENT: 15, // percentage
    POOR: 5
  },
  LEAD_GROWTH: {
    STRONG: 20, // percentage
    DECLINING: -10
  },
  INSIGHTS: {
    HIGH_CONVERTING_INTEREST: 50, // percentage
    BALANCED_SOURCE_THRESHOLD: 70, // percentage
    STRONG_MONTHLY_CHANGE: 25, // percentage
    DECLINE_MONTHLY_CHANGE: -25 // percentage
  }
} as const;

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'excel'
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

// Date formats for exports
export const DATE_FORMATS = {
  UK: 'UK',
  US: 'US',
  ISO: 'ISO'
} as const;

export type DateFormat = typeof DATE_FORMATS[keyof typeof DATE_FORMATS];

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
} as const;

// Venue filter constants (all venues)
export const VENUE_FILTER_ALL = 'all' as const;

// Search and filter limits
export const SEARCH_LIMITS = {
  MAX_SEARCH_LENGTH: 100,
  MAX_FILTER_ITEMS: 10,
  MAX_BULK_OPERATIONS: 100
} as const;

// Lead validation limits
export const VALIDATION_LIMITS = {
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MAX_LENGTH: 20,
  NOTES_MAX_LENGTH: 2000,
  INTERESTS_MAX_COUNT: 20,
  LEAD_MAGNET_MAX_COUNT: 10,
  LEAD_MAGNET_MAX_LENGTH: 200,
  PROMPT_MAX_LENGTH: 1000,
  PRIVACY_NOTICE_MAX_LENGTH: 2000
} as const;

// Analytics time periods
export const ANALYTICS_PERIODS = {
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  LAST_90_DAYS: 90,
  LAST_6_MONTHS: 180,
  LAST_YEAR: 365
} as const;

// Dashboard refresh intervals (in seconds)
export const REFRESH_INTERVALS = {
  REAL_TIME: 30,
  FREQUENT: 60,
  NORMAL: 300,    // 5 minutes
  SLOW: 900       // 15 minutes
} as const;

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid UK phone number',
    NAME_TOO_LONG: `Name must be less than ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters`,
    NOTES_TOO_LONG: `Notes must be less than ${VALIDATION_LIMITS.NOTES_MAX_LENGTH} characters`,
    INVALID_STATUS_TRANSITION: 'Invalid status transition',
    INVALID_SCORE: 'Lead score must be between 0 and 100'
  },
  API: {
    LEAD_NOT_FOUND: 'Lead not found',
    UNAUTHORISED: 'Unauthorised access',
    RATE_LIMITED: 'Too many requests, please try again later',
    SERVER_ERROR: 'Internal server error',
    VALIDATION_FAILED: 'Validation failed'
  },
  EXPORT: {
    NO_DATA: 'No data to export',
    EXPORT_FAILED: 'Export failed, please try again',
    INVALID_FORMAT: 'Invalid export format'
  }
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LEAD_CREATED: 'Lead created successfully',
  LEAD_UPDATED: 'Lead updated successfully',
  LEAD_DELETED: 'Lead deleted successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  EXPORT_COMPLETED: 'Export completed successfully',
  BULK_UPDATE_COMPLETED: 'Bulk update completed successfully'
} as const;

// UI Labels and display text
export const UI_LABELS = {
  STATUS_LABELS: {
    [LEAD_STATUSES.NEW]: 'New Lead',
    [LEAD_STATUSES.CONTACTED]: 'Contacted',
    [LEAD_STATUSES.QUALIFIED]: 'Qualified',
    [LEAD_STATUSES.CONVERTED]: 'Converted',
    [LEAD_STATUSES.LOST]: 'Lost'
  },
  INTEREST_LABELS: {
    [INTEREST_LEVELS.HIGH]: 'High Interest',
    [INTEREST_LEVELS.MEDIUM]: 'Medium Interest',
    [INTEREST_LEVELS.LOW]: 'Low Interest'
  },
  SOURCE_LABELS: {
    [LEAD_SOURCES.CHATBOT]: 'Chatbot',
    [LEAD_SOURCES.TOUR]: 'Tour',
    [LEAD_SOURCES.CONTACT_FORM]: 'Contact Form',
    [LEAD_SOURCES.MANUAL]: 'Manual Entry'
  },
  CHATBOT_LABELS: {
    [CHATBOT_TYPES.TOUR]: 'Tour Chatbot'
  }
} as const;

// Color schemes for UI components
export const UI_COLORS = {
  STATUS_COLORS: {
    [LEAD_STATUSES.NEW]: 'bg-blue-100 text-blue-800 border-blue-200',
    [LEAD_STATUSES.CONTACTED]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [LEAD_STATUSES.QUALIFIED]: 'bg-purple-100 text-purple-800 border-purple-200',
    [LEAD_STATUSES.CONVERTED]: 'bg-green-100 text-green-800 border-green-200',
    [LEAD_STATUSES.LOST]: 'bg-red-100 text-red-800 border-red-200'
  },
  INTEREST_COLORS: {
    [INTEREST_LEVELS.HIGH]: 'bg-red-100 text-red-800 border-red-200',
    [INTEREST_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [INTEREST_LEVELS.LOW]: 'bg-green-100 text-green-800 border-green-200'
  },
  SCORE_COLORS: {
    HIGH: 'text-green-600',
    MEDIUM: 'text-yellow-600',
    LOW: 'text-red-600'
  }
} as const;

// Feature flags for gradual rollout
export const FEATURE_FLAGS = {
  LEAD_CAPTURE_ENABLED: true,
  ADVANCED_ANALYTICS: true,
  BULK_OPERATIONS: true,
  EXPORT_FUNCTIONALITY: true,
  AI_SCORING: true,
  AUTOMATED_FOLLOW_UP: false, // Future feature
  INTEGRATION_CRM: false      // Future feature
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  LEAD_CREATION: {
    requests: 10,
    window: 60 // 10 requests per minute
  },
  EXPORT_OPERATIONS: {
    requests: 3,
    window: 300 // 3 exports per 5 minutes
  },
  BULK_OPERATIONS: {
    requests: 5,
    window: 300 // 5 bulk operations per 5 minutes
  }
} as const; 