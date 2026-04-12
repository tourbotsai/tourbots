import "server-only";

import { Guide, ResourceFilters } from "@/lib/types";
import { supabaseServiceRole } from "@/lib/supabase-service-role";

const FRONTEND_GUIDE_TABLE = "resource_guides";
const LEGACY_GUIDE_TABLE = "guides";

type RawGuide = Record<string, any>;

function toGuide(raw: RawGuide): Guide {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt ?? raw.summary ?? null,
    content: raw.content ?? raw.body_markdown ?? "",
    cover_image: raw.cover_image ?? raw.cover_image_url ?? null,
    header_image: raw.header_image ?? raw.header_image_url ?? null,
    additional_images: raw.additional_images ?? raw.gallery_images ?? [],
    meta_title: raw.meta_title ?? null,
    meta_description: raw.meta_description ?? null,
    tags: raw.tags ?? [],
    difficulty_level: raw.difficulty_level ?? raw.level ?? "beginner",
    is_published: raw.is_published ?? raw.is_live ?? false,
    published_at: raw.published_at ?? raw.published_on ?? null,
    view_count: raw.view_count ?? raw.views ?? 0,
    reading_time_minutes: raw.reading_time_minutes ?? raw.estimated_read_minutes ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function isMissingTable(error: any): boolean {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("schema cache")
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

async function queryGuidesTable(
  tableName: string,
  filters: ResourceFilters = {}
): Promise<RawGuide[]> {
  let query = supabaseServiceRole
    .from(tableName)
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  if (filters.difficulty) {
    query = query.eq("difficulty_level", filters.difficulty);
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

async function queryGuideBySlug(tableName: string, slug: string): Promise<RawGuide | null> {
  const { data, error } = await supabaseServiceRole
    .from(tableName)
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getPublicGuides(filters: ResourceFilters = {}): Promise<Guide[]> {
  const rows = await fetchFromPrimaryThenLegacy(
    () => queryGuidesTable(FRONTEND_GUIDE_TABLE, filters),
    () => queryGuidesTable(LEGACY_GUIDE_TABLE, filters)
  );
  return rows.map(toGuide);
}

export async function getPublicGuideBySlug(slug: string): Promise<Guide | null> {
  const row = await fetchFromPrimaryThenLegacy(
    () => queryGuideBySlug(FRONTEND_GUIDE_TABLE, slug),
    () => queryGuideBySlug(LEGACY_GUIDE_TABLE, slug)
  );
  return row ? toGuide(row) : null;
}

export async function getPublicGuideTags(): Promise<string[]> {
  const fetchTags = async (tableName: string): Promise<string[]> => {
    const { data, error } = await supabaseServiceRole
      .from(tableName)
      .select("tags")
      .eq("is_published", true);

    if (error) throw error;
    const allTags = data?.flatMap((guide: any) => guide.tags || []) || [];
    return Array.from(new Set(allTags)).sort();
  };

  return fetchFromPrimaryThenLegacy(
    () => fetchTags(FRONTEND_GUIDE_TABLE),
    () => fetchTags(LEGACY_GUIDE_TABLE)
  );
}

export async function incrementPublicGuideViews(guideId: string): Promise<void> {
  const updateViews = async (tableName: string) => {
    const { data: currentGuide, error: fetchError } = await supabaseServiceRole
      .from(tableName)
      .select("view_count")
      .eq("id", guideId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentGuide) return;

    const { error: updateError } = await supabaseServiceRole
      .from(tableName)
      .update({ view_count: (currentGuide.view_count || 0) + 1 })
      .eq("id", guideId);

    if (updateError) throw updateError;
  };

  try {
    await fetchFromPrimaryThenLegacy(
      () => updateViews(FRONTEND_GUIDE_TABLE),
      () => updateViews(LEGACY_GUIDE_TABLE)
    );
  } catch (error) {
    console.warn("incrementPublicGuideViews warning:", error);
  }
}
