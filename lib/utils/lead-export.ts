import { Lead } from '@/lib/types';
import { EXPORT_FORMATS, type ExportFormat } from '../constants/lead-constants';
import { supabase } from '../supabase';

// Export field configuration
export interface ExportField {
  key: keyof Lead | string;
  label: string;
  transform?: (value: any, lead: Lead, options?: { dateFormat?: string }) => string;
  include?: boolean;
}

// Export options
export interface LeadExportOptions {
  format: ExportFormat;
  fields?: ExportField[];
  includeHeaders?: boolean;
  dateFormat?: 'UK' | 'US' | 'ISO';
  filename?: string;
  filterEmptyRows?: boolean;
}

// Default export fields configuration
export const DEFAULT_EXPORT_FIELDS: ExportField[] = [
  { key: 'visitor_name', label: 'Name', include: true },
  { key: 'visitor_email', label: 'Email Address', include: true },
  { key: 'visitor_phone', label: 'Phone Number', include: true },
  { 
    key: 'lead_status', 
    label: 'Status', 
    include: true,
    transform: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
  },
  { 
    key: 'interest_level', 
    label: 'Interest Level', 
    include: true,
    transform: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
  },
  { 
    key: 'lead_score', 
    label: 'Lead Score', 
    include: true,
    transform: (value) => value?.toString() || '0'
  },
  { 
    key: 'source', 
    label: 'Source', 
    include: true,
    transform: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
  },
  { 
    key: 'chatbot_type', 
    label: 'Chatbot Type', 
    include: true,
    transform: (value) => {
      if (value === 'tour') return 'Tour Chatbot';
      return value || '';
    }
  },
  { key: 'lead_notes', label: 'Notes', include: true },
  { 
    key: 'interests', 
    label: 'Interests', 
    include: true,
    transform: (value) => {
      if (Array.isArray(value)) {
        return value.map(interest => 
          interest.replace(/_/g, ' ')
                 .split(' ')
                 .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                 .join(' ')
        ).join(', ');
      }
      return '';
    }
  },
  { 
    key: 'created_at', 
    label: 'Created Date', 
    include: true,
    transform: (value, lead, options) => 
      formatDateForExport(value, options?.dateFormat || 'UK')
  },
  { 
    key: 'updated_at', 
    label: 'Last Updated', 
    include: false,
    transform: (value, lead, options) => 
      formatDateForExport(value, options?.dateFormat || 'UK')
  },
  { 
    key: 'follow_up_date', 
    label: 'Follow Up Date', 
    include: false,
    transform: (value, lead, options) => 
      value ? formatDateForExport(value, options?.dateFormat || 'UK') : ''
  },
  { 
    key: 'last_contacted_at', 
    label: 'Last Contacted', 
    include: false,
    transform: (value, lead, options) => 
      value ? formatDateForExport(value, options?.dateFormat || 'UK') : ''
  }
];

// Format date for export based on locale preference
export function formatDateForExport(dateString: string | null, format: string = 'UK'): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  switch (format) {
    case 'UK':
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'US':
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'ISO':
      return date.toISOString();
    default:
      return date.toLocaleDateString('en-GB');
  }
}

// Generate filename with timestamp
export function generateExportFilename(
  prefix: string = 'leads',
  format: ExportFormat = EXPORT_FORMATS.CSV,
  includeTimestamp: boolean = true
): string {
  const timestamp = includeTimestamp 
    ? new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
    : '';
  
  const extension = format === EXPORT_FORMATS.EXCEL ? 'xlsx' : format;
  const parts = [prefix, timestamp].filter(Boolean);
  
  return `${parts.join('_')}.${extension}`;
}

// Convert leads to CSV format
export function convertLeadsToCSV(
  leads: Lead[], 
  options: LeadExportOptions = { format: 'csv' }
): string {
  const fields = options.fields || DEFAULT_EXPORT_FIELDS.filter(f => f.include);
  const includeHeaders = options.includeHeaders !== false;
  
  const rows: string[] = [];
  
  // Add headers if requested
  if (includeHeaders) {
    const headers = fields.map(field => `"${field.label}"`);
    rows.push(headers.join(','));
  }
  
  // Add data rows
  leads.forEach(lead => {
    const values = fields.map(field => {
      let value: any;
      
      // Handle nested properties
      if (field.key.includes('.')) {
        const keys = field.key.split('.');
        value = keys.reduce((obj, key) => obj?.[key], lead as any);
      } else {
        // Type-safe access to Lead properties
        value = lead[field.key as keyof Lead];
      }
      
      // Apply transformation if provided
      if (field.transform) {
        value = field.transform(value, lead, { dateFormat: options.dateFormat });
      }
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Convert to string and escape quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    
    // Only add row if it has content or we're not filtering empty rows
    if (!options.filterEmptyRows || values.some(v => v !== '""')) {
      rows.push(values.join(','));
    }
  });
  
  return rows.join('\n');
}

// Convert leads to JSON format
export function convertLeadsToJSON(
  leads: Lead[], 
  options: LeadExportOptions = { format: 'json' }
): string {
  const fields = options.fields || DEFAULT_EXPORT_FIELDS.filter(f => f.include);
  
  const transformedLeads = leads.map(lead => {
    const transformedLead: Record<string, any> = {};
    
    fields.forEach(field => {
      let value: any;
      
      // Handle nested properties
      if (field.key.includes('.')) {
        const keys = field.key.split('.');
        value = keys.reduce((obj, key) => obj?.[key], lead as any);
      } else {
        // Type-safe access to Lead properties
        value = lead[field.key as keyof Lead];
      }
      
      // Apply transformation if provided
      if (field.transform) {
        value = field.transform(value, lead, { dateFormat: options.dateFormat });
      }
      
      transformedLead[field.label] = value;
    });
    
    return transformedLead;
  });
  
  return JSON.stringify(transformedLeads, null, 2);
}

// Main export function
export async function exportLeads(
  leads: Lead[], 
  options: LeadExportOptions
): Promise<{ data: string; filename: string; mimeType: string }> {
  const filename = options.filename || generateExportFilename('leads', options.format);
  
  let data: string;
  let mimeType: string;
  
  if (options.format === EXPORT_FORMATS.CSV) {
    data = convertLeadsToCSV(leads, options);
    mimeType = 'text/csv';
  } else if (options.format === EXPORT_FORMATS.JSON) {
    data = convertLeadsToJSON(leads, options);
    mimeType = 'application/json';
  } else if (options.format === EXPORT_FORMATS.EXCEL) {
    // For Excel, we'll return CSV data with Excel MIME type
    // The frontend can handle the actual Excel conversion
    data = convertLeadsToCSV(leads, options);
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else {
    throw new Error(`Unsupported export format: ${options.format}`);
  }
  
  return { data, filename, mimeType };
}

// Create download blob for browser
export function createDownloadBlob(data: string, mimeType: string): Blob {
  return new Blob([data], { type: mimeType });
}

// Trigger download in browser
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export leads and trigger download
export async function exportAndDownloadLeads(
  leads: Lead[], 
  options: LeadExportOptions
): Promise<void> {
  try {
    const { data, filename, mimeType } = await exportLeads(leads, options);
    const blob = createDownloadBlob(data, mimeType);
    triggerDownload(blob, filename);
  } catch (error) {
    console.error('Error exporting leads:', error);
    throw new Error('Failed to export leads. Please try again.');
  }
}

// Get export statistics
export function getExportStatistics(leads: Lead[]): {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByInterestLevel: Record<string, number>;
  dateRange: { earliest: string; latest: string } | null;
} {
  if (leads.length === 0) {
    return {
      totalLeads: 0,
      leadsByStatus: {},
      leadsBySource: {},
      leadsByInterestLevel: {},
      dateRange: null
    };
  }
  
  const leadsByStatus: Record<string, number> = {};
  const leadsBySource: Record<string, number> = {};
  const leadsByInterestLevel: Record<string, number> = {};
  
  let earliest = leads[0].created_at;
  let latest = leads[0].created_at;
  
  leads.forEach(lead => {
    // Count by status
    leadsByStatus[lead.lead_status] = (leadsByStatus[lead.lead_status] || 0) + 1;
    
    // Count by source
    const source = lead.source || 'unknown';
    leadsBySource[source] = (leadsBySource[source] || 0) + 1;
    
    // Count by interest level
    if (lead.interest_level) {
      leadsByInterestLevel[lead.interest_level] = (leadsByInterestLevel[lead.interest_level] || 0) + 1;
    }
    
    // Track date range
    if (lead.created_at < earliest) earliest = lead.created_at;
    if (lead.created_at > latest) latest = lead.created_at;
  });
  
  return {
    totalLeads: leads.length,
    leadsByStatus,
    leadsBySource,
    leadsByInterestLevel,
    dateRange: { earliest, latest }
  };
}

// Validate export options
export function validateExportOptions(options: LeadExportOptions): string[] {
  const errors: string[] = [];
  
  // Validate format
  const validFormats = Object.values(EXPORT_FORMATS);
  if (!validFormats.includes(options.format as any)) {
    errors.push(`Invalid export format. Must be ${validFormats.join(', ')}.`);
  }
  
  if (options.fields && !Array.isArray(options.fields)) {
    errors.push('Fields must be an array.');
  }
  
  if (options.dateFormat && !['UK', 'US', 'ISO'].includes(options.dateFormat)) {
    errors.push('Invalid date format. Must be UK, US, or ISO.');
  }
  
  if (options.filename && !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(options.filename)) {
    errors.push('Invalid filename format.');
  }
  
  return errors;
}

// Export field builder helper
export class ExportFieldBuilder {
  private fields: ExportField[] = [];
  
  addField(key: keyof Lead | string, label: string, options?: {
    transform?: (value: any, lead: Lead, options?: { dateFormat?: string }) => string;
    include?: boolean;
  }): ExportFieldBuilder {
    this.fields.push({
      key,
      label,
      transform: options?.transform,
      include: options?.include !== false
    });
    return this;
  }
  
  addDateField(key: keyof Lead | string, label: string, dateFormat: string = 'UK'): ExportFieldBuilder {
    return this.addField(key, label, {
      transform: (value) => formatDateForExport(value, dateFormat)
    });
  }
  
  addArrayField(key: keyof Lead | string, label: string, separator: string = ', '): ExportFieldBuilder {
    return this.addField(key, label, {
      transform: (value) => Array.isArray(value) ? value.join(separator) : String(value || '')
    });
  }
  
  build(): ExportField[] {
    return this.fields;
  }
  
  static create(): ExportFieldBuilder {
    return new ExportFieldBuilder();
  }
}

// Preset export configurations
export const EXPORT_PRESETS = {
  basic: {
    format: EXPORT_FORMATS.CSV as ExportFormat,
    fields: DEFAULT_EXPORT_FIELDS.filter(f => 
      ['visitor_name', 'visitor_email', 'visitor_phone', 'lead_status', 'created_at'].includes(f.key as string)
    ),
    includeHeaders: true,
    dateFormat: 'UK' as const
  },
  
  detailed: {
    format: EXPORT_FORMATS.CSV as ExportFormat,
    fields: DEFAULT_EXPORT_FIELDS.filter(f => f.include),
    includeHeaders: true,
    dateFormat: 'UK' as const
  },
  
  analytics: {
    format: EXPORT_FORMATS.JSON as ExportFormat,
    fields: DEFAULT_EXPORT_FIELDS,
    includeHeaders: true,
    dateFormat: 'ISO' as const
  }
} as const; 