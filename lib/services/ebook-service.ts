import { supabase } from '../supabase';
import { Ebook, EbookLead, EbookLeadCreateData, ResourceFilters } from '../types';

// Primary new table for frontend ebook content.
// Falls back to legacy 'ebooks' until migration is complete.
const FRONTEND_EBOOK_TABLE = 'resource_ebooks';
const LEGACY_EBOOK_TABLE = 'ebooks';

type RawEbook = Record<string, any>;

function toEbook(raw: RawEbook): Ebook {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? raw.summary ?? null,
    content: raw.content ?? raw.body_markdown ?? '',
    cover_image: raw.cover_image ?? raw.cover_image_url ?? null,
    header_image: raw.header_image ?? raw.header_image_url ?? null,
    additional_images: raw.additional_images ?? raw.gallery_images ?? [],
    meta_title: raw.meta_title ?? null,
    meta_description: raw.meta_description ?? null,
    tags: raw.tags ?? [],
    is_published: raw.is_published ?? raw.is_live ?? false,
    published_at: raw.published_at ?? raw.published_on ?? null,
    view_count: raw.view_count ?? raw.views ?? 0,
    download_count: raw.download_count ?? raw.downloads ?? 0,
    reading_time_minutes: raw.reading_time_minutes ?? raw.estimated_read_minutes ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function isMissingTable(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('schema cache')
  );
}

async function fetchFromPrimaryThenLegacy<T>(
  primary: () => Promise<T>,
  legacy: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (!isMissingTable(error)) throw error;
    return legacy();
  }
}

async function queryEbooksTable(
  tableName: string,
  filters: ResourceFilters = {}
): Promise<RawEbook[]> {
  let query = supabase
    .from(tableName)
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function queryEbookBySlug(tableName: string, slug: string): Promise<RawEbook | null> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

// Get all published ebooks with optional filtering
export async function getEbooks(filters: ResourceFilters = {}): Promise<Ebook[]> {
  try {
    const rows = await fetchFromPrimaryThenLegacy(
      () => queryEbooksTable(FRONTEND_EBOOK_TABLE, filters),
      () => queryEbooksTable(LEGACY_EBOOK_TABLE, filters)
    );
    return rows.map(toEbook);
  } catch (error) {
    console.error('Error in getEbooks:', error);
    throw error;
  }
}

// Get a single ebook by slug
export async function getEbookBySlug(slug: string): Promise<Ebook | null> {
  try {
    const row = await fetchFromPrimaryThenLegacy(
      () => queryEbookBySlug(FRONTEND_EBOOK_TABLE, slug),
      () => queryEbookBySlug(LEGACY_EBOOK_TABLE, slug)
    );
    return row ? toEbook(row) : null;
  } catch (error) {
    console.error('Error in getEbookBySlug:', error);
    throw error;
  }
}

// Increment ebook view count
export async function incrementEbookViews(ebookId: string): Promise<void> {
  try {
    const updateViews = async (tableName: string) => {
      const { data: currentEbook, error: fetchError } = await supabase
        .from(tableName)
        .select('view_count')
        .eq('id', ebookId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentEbook) return;

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ view_count: (currentEbook.view_count || 0) + 1 })
        .eq('id', ebookId);

      if (updateError) throw updateError;
    };

    await fetchFromPrimaryThenLegacy(
      () => updateViews(FRONTEND_EBOOK_TABLE),
      () => updateViews(LEGACY_EBOOK_TABLE)
    );
  } catch (error) {
    // View count is non-critical; keep this non-blocking.
    console.warn('incrementEbookViews warning:', error);
  }
}

// Increment ebook download count
export async function incrementEbookDownloads(ebookId: string): Promise<void> {
  try {
    const updateDownloads = async (tableName: string) => {
      const { data: currentEbook, error: fetchError } = await supabase
        .from(tableName)
        .select('download_count')
        .eq('id', ebookId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentEbook) return;

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ download_count: (currentEbook.download_count || 0) + 1 })
        .eq('id', ebookId);

      if (updateError) throw updateError;
    };

    await fetchFromPrimaryThenLegacy(
      () => updateDownloads(FRONTEND_EBOOK_TABLE),
      () => updateDownloads(LEGACY_EBOOK_TABLE)
    );
  } catch (error) {
    // Download count is non-critical; keep this non-blocking.
    console.warn('incrementEbookDownloads warning:', error);
  }
}

// Get featured ebooks (most downloaded or recent)
export async function getFeaturedEbooks(limit: number = 3): Promise<Ebook[]> {
  try {
    const fetchFeatured = async (tableName: string): Promise<RawEbook[]> => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_published', true)
        .order('download_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    };

    const rows = await fetchFromPrimaryThenLegacy(
      () => fetchFeatured(FRONTEND_EBOOK_TABLE),
      () => fetchFeatured(LEGACY_EBOOK_TABLE)
    );
    return rows.map(toEbook);
  } catch (error) {
    console.error('Error in getFeaturedEbooks:', error);
    throw error;
  }
}

// Get all unique tags from published ebooks
export async function getEbookTags(): Promise<string[]> {
  try {
    const fetchTags = async (tableName: string): Promise<string[]> => {
      const { data, error } = await supabase
        .from(tableName)
        .select('tags')
        .eq('is_published', true);

      if (error) throw error;
      const allTags = data?.flatMap((ebook: any) => ebook.tags || []) || [];
      return Array.from(new Set(allTags)).sort();
    };

    return await fetchFromPrimaryThenLegacy(
      () => fetchTags(FRONTEND_EBOOK_TABLE),
      () => fetchTags(LEGACY_EBOOK_TABLE)
    );
  } catch (error) {
    console.error('Error in getEbookTags:', error);
    throw error;
  }
}

// Create an ebook lead capture entry
export async function createEbookLead(leadData: EbookLeadCreateData): Promise<EbookLead> {
  try {
    const { data, error } = await supabase
      .from('ebook_leads')
      .insert([{
        ebook_id: leadData.ebook_id,
        contact_name: leadData.contact_name,
        venue_name: leadData.venue_name,
        email: leadData.email,
        phone: leadData.phone || null,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating ebook lead:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createEbookLead:', error);
    throw error;
  }
}

// Get ebook leads for analytics (could be used for admin later)
export async function getEbookLeads(ebookId?: string): Promise<EbookLead[]> {
  try {
    let query = supabase
      .from('ebook_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (ebookId) {
      query = query.eq('ebook_id', ebookId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ebook leads:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEbookLeads:', error);
    throw error;
  }
} 