import { MetadataRoute } from 'next'
import { supabaseServiceRole } from '@/lib/supabase-service-role'
import { getSiteUrl } from '@/lib/site-url'
const BLOG_TABLE_PRIMARY = 'resource_blog_posts'
const BLOG_TABLE_LEGACY = 'blogs'
const GUIDE_TABLE_PRIMARY = 'resource_guides'
const GUIDE_TABLE_LEGACY = 'guides'

// Revalidate sitemap every hour to pick up new published content
export const revalidate = 3600

function isMissingTable(error: any): boolean {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('schema cache')
  )
}

async function fetchPublishedRows(
  primaryTable: string,
  legacyTable: string
): Promise<any[]> {
  const { data: primaryRows, error: primaryError } = await supabaseServiceRole
    .from(primaryTable)
    .select('slug, updated_at, created_at, is_published, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (!primaryError) {
    return primaryRows || []
  }

  if (!isMissingTable(primaryError)) {
    throw primaryError
  }

  const { data: legacyCompatRows, error: legacyCompatError } = await supabaseServiceRole
    .from(legacyTable)
    .select('slug, updated_at, created_at, is_published, published_at, published')
    .or('is_published.eq.true,published.eq.true')
    .order('published_at', { ascending: false })

  if (legacyCompatError) {
    throw legacyCompatError
  }

  return legacyCompatRows || []
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/resources/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/guides`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  try {
    const blogs = await fetchPublishedRows(BLOG_TABLE_PRIMARY, BLOG_TABLE_LEGACY)

    // Generate blog URLs
    const blogPages: MetadataRoute.Sitemap = (blogs || []).map((blog) => ({
      url: `${baseUrl}/resources/blogs/${blog.slug}`,
      lastModified: new Date(blog.updated_at || blog.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    const guides = await fetchPublishedRows(GUIDE_TABLE_PRIMARY, GUIDE_TABLE_LEGACY)

    // Generate guide URLs
    const guidePages: MetadataRoute.Sitemap = (guides || []).map((guide) => ({
      url: `${baseUrl}/resources/guides/${guide.slug}`,
      lastModified: new Date(guide.updated_at || guide.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    // Combine all pages
    return [...staticPages, ...blogPages, ...guidePages]

  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages if dynamic generation fails
    return staticPages
  }
} 