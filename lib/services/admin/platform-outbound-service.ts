import { supabaseServiceRole as supabase } from '../../supabase-service-role';

export interface PlatformOutboundLead {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  lead_source: string | null;
  lead_status: 'new' | 'attempted_contact' | 'in_conversation' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  notes_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformOutboundLeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  created_by_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface PlatformOutboundLeadNoteRow {
  id: string;
  lead_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  created_by_user?: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  }> | null;
}

function mapLeadNoteRow(row: PlatformOutboundLeadNoteRow): PlatformOutboundLeadNote {
  return {
    id: row.id,
    lead_id: row.lead_id,
    note: row.note,
    created_by: row.created_by,
    created_at: row.created_at,
    created_by_user: row.created_by_user?.[0] ?? null,
  };
}

export async function getPlatformOutboundLeads(search?: string): Promise<PlatformOutboundLead[]> {
  let query = supabase
    .from('platform_outbound_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search && search.trim().length > 0) {
    const trimmedSearch = search.trim();
    query = query.or(
      `company_name.ilike.%${trimmedSearch}%,contact_name.ilike.%${trimmedSearch}%,contact_email.ilike.%${trimmedSearch}%,contact_phone.ilike.%${trimmedSearch}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching platform outbound leads:', error);
    throw error;
  }

  return (data ?? []) as PlatformOutboundLead[];
}

export async function getPlatformOutboundLeadById(leadId: string): Promise<PlatformOutboundLead | null> {
  const { data, error } = await supabase
    .from('platform_outbound_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching platform outbound lead by ID:', error);
    throw error;
  }

  return data as PlatformOutboundLead;
}

export async function getPlatformOutboundLeadNotes(leadId: string): Promise<PlatformOutboundLeadNote[]> {
  const { data, error } = await supabase
    .from('platform_outbound_lead_notes')
    .select(`
      id,
      lead_id,
      note,
      created_by,
      created_at,
      created_by_user:users(id, first_name, last_name, email)
    `)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching platform outbound lead notes:', error);
    throw error;
  }

  return ((data ?? []) as PlatformOutboundLeadNoteRow[]).map(mapLeadNoteRow);
}

export async function createPlatformOutboundLeadNote(
  leadId: string,
  note: string,
  createdBy?: string | null
): Promise<PlatformOutboundLeadNote> {
  const cleanNote = note.trim();
  if (!cleanNote) {
    throw new Error('Note cannot be empty');
  }

  const { data, error } = await supabase
    .from('platform_outbound_lead_notes')
    .insert([
      {
        lead_id: leadId,
        note: cleanNote,
        created_by: createdBy ?? null,
      },
    ])
    .select(`
      id,
      lead_id,
      note,
      created_by,
      created_at,
      created_by_user:users(id, first_name, last_name, email)
    `)
    .single();

  if (error) {
    console.error('Error creating platform outbound lead note:', error);
    throw error;
  }

  return mapLeadNoteRow(data as PlatformOutboundLeadNoteRow);
}
