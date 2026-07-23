import "server-only";

import { Blog, ResourceFilters } from "@/lib/types";
import { supabaseServiceRole } from "@/lib/supabase-service-role";

const BLOG_TABLE = "blogs";

type RawBlog = Record<string, any>;

function toBlog(raw: RawBlog): Blog {
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
    is_published: raw.is_published ?? raw.is_live ?? false,
    published_at: raw.published_at ?? raw.published_on ?? null,
    scheduled_publish_at: raw.scheduled_publish_at ?? null,
    is_scheduled: raw.is_scheduled ?? false,
    schedule_timezone: raw.schedule_timezone ?? undefined,
    view_count: raw.view_count ?? raw.views ?? 0,
    reading_time_minutes: raw.reading_time_minutes ?? raw.estimated_read_minutes ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

async function queryBlogsTable(filters: ResourceFilters = {}): Promise<RawBlog[]> {
  let query = supabaseServiceRole
    .from(BLOG_TABLE)
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
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

export async function getPublicBlogs(filters: ResourceFilters = {}): Promise<Blog[]> {
  const rows = await queryBlogsTable(filters);
  return rows.map(toBlog);
}

export async function getPublicBlogBySlug(slug: string): Promise<Blog | null> {
  const { data, error } = await supabaseServiceRole
    .from(BLOG_TABLE)
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data ? toBlog(data) : null;
}

export async function getPublicBlogTags(): Promise<string[]> {
  const { data, error } = await supabaseServiceRole
    .from(BLOG_TABLE)
    .select("tags")
    .eq("is_published", true);

  if (error) throw error;
  const allTags = data?.flatMap((blog: any) => blog.tags || []) || [];
  return Array.from(new Set(allTags)).sort();
}

export async function incrementPublicBlogViews(blogId: string): Promise<void> {
  try {
    const { data: currentBlog, error: fetchError } = await supabaseServiceRole
      .from(BLOG_TABLE)
      .select("view_count")
      .eq("id", blogId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentBlog) return;

    const { error: updateError } = await supabaseServiceRole
      .from(BLOG_TABLE)
      .update({ view_count: (currentBlog.view_count || 0) + 1 })
      .eq("id", blogId);

    if (updateError) throw updateError;
  } catch (error) {
    console.warn("incrementPublicBlogViews warning:", error);
  }
}
