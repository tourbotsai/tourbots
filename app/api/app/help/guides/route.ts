import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

const GUIDE_TABLE = 'guides';

async function queryGuides(search?: string) {
  let query = supabase
    .from(GUIDE_TABLE)
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(100);

  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
  }

  return query;
}

function mapGuide(raw: any) {
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
    difficulty_level: raw.difficulty_level ?? raw.level ?? 'beginner',
    is_published: raw.is_published ?? raw.is_live ?? false,
    published_at: raw.published_at ?? raw.published_on ?? null,
    view_count: raw.view_count ?? raw.views ?? 0,
    reading_time_minutes: raw.reading_time_minutes ?? raw.estimated_read_minutes ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    const { data, error: queryError } = await queryGuides(search || undefined);
    const rows = data || [];

    if (queryError) {
      throw queryError;
    }

    const guides = rows.map(mapGuide);
    const tags = Array.from(
      new Set(guides.flatMap((guide: any) => guide.tags || []))
    ).sort();

    return NextResponse.json({ guides, tags });
  } catch (error: any) {
    console.error('Error fetching app help guides:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch help guides' },
      { status: 500 }
    );
  }
}
