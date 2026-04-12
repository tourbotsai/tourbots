import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// HTML sanitisation
export function sanitiseHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

// Strip all HTML tags
export function stripHTML(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// Sanitise chat message input
export function sanitiseChatMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message format');
  }

  // Remove excessive whitespace
  const trimmed = message.trim();
  
  // Check length limits
  if (trimmed.length === 0) {
    throw new Error('Message cannot be empty');
  }
  
  if (trimmed.length > 2000) {
    throw new Error('Message too long (max 2000 characters)');
  }

  // Strip HTML but allow basic formatting
  return sanitiseHTML(trimmed);
}

// Sanitise venue information input
export function sanitiseVenueInfo(info: string): string {
  if (!info || typeof info !== 'string') {
    return '';
  }

  // Allow more tags for venue descriptions
  return DOMPurify.sanitize(info, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
}

// Validate and sanitise file names
export function sanitiseFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid file name');
  }

  // Remove path traversal attempts
  const cleaned = fileName.replace(/[\/\\:*?"<>|]/g, '');
  
  // Remove leading dots and spaces
  const trimmed = cleaned.replace(/^[.\s]+/, '');
  
  if (trimmed.length === 0) {
    throw new Error('Invalid file name');
  }

  return trimmed.substring(0, 255); // Limit length
}

// Validate URLs
export function validateURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Sanitise search queries
export function sanitiseSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove special characters that could be used for injection
  return query
    .replace(/[<>;"'(){}[\]]/g, '')
    .trim()
    .substring(0, 100);
}

// Validate email addresses
export const emailSchema = z.string().email().max(254);

// Validate venue IDs (UUIDs)
export const uuidSchema = z.string().uuid();

// Chat message validation schema
export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long')
    .transform(sanitiseChatMessage),
  venueId: uuidSchema,
  chatbotType: z.enum(['tour']).optional().transform((v) => v ?? 'tour'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
    timestamp: z.string()
  })).max(50) // Limit conversation history
});

// Venue information validation schema
export const venueInfoSchema = z.object({
  venue_name: z.string().max(100).optional().transform(val => val ? stripHTML(val) : val),
  description: z.string().max(1000).optional().transform(val => val ? sanitiseVenueInfo(val) : val),
  website_url: z.string().url().optional(),
  phone_number: z.string().regex(/^[\d\s\+\-\(\)]+$/).max(20).optional(),
  email: emailSchema.optional(),
  // ... add other fields as needed
});

// File upload validation
export const fileUploadSchema = z.object({
  fileName: z.string().transform(sanitiseFileName),
  fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
  fileType: z.enum(['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
});

// Rate limit update schema
export const rateLimitConfigSchema = z.object({
  requestsPerMinute: z.number().min(1).max(1000),
  requestsPerHour: z.number().min(1).max(10000),
  requestsPerDay: z.number().min(1).max(100000),
  burstLimit: z.number().min(1).max(100),
  enabled: z.boolean()
}); 