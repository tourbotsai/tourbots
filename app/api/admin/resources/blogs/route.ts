import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogs, createBlog, generateUniqueSlug, getAllBlogTags, AdminBlogData } from '@/lib/services/admin/admin-blog-service';
import { ResourceFilters } from '@/lib/types';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: ResourceFilters = {
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      published: searchParams.get('published') ? searchParams.get('published') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    // Special endpoint for tags
    if (searchParams.get('tags_only') === 'true') {
      const tags = await getAllBlogTags();
      return NextResponse.json({ tags });
    }

    const blogs = await getAllBlogs(filters);
    
    return NextResponse.json({
      success: true,
      blogs,
      count: blogs.length,
    });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const blogData: AdminBlogData = await request.json();

    // Validate required fields
    if (!blogData.title || !blogData.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    if (!blogData.slug) {
      blogData.slug = await generateUniqueSlug(blogData.title);
    } else {
      // Validate slug uniqueness if provided
      const { checkSlugUnique } = await import('@/lib/services/admin/admin-blog-service');
      const isUnique = await checkSlugUnique(blogData.slug);
      if (!isUnique) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists. Please choose a different slug.' },
          { status: 400 }
        );
      }
    }

    // Validate tags if provided
    if (blogData.tags && blogData.tags.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'All tags must be non-empty strings' },
        { status: 400 }
      );
    }

    const blog = await createBlog(blogData);
    
    return NextResponse.json({
      success: true,
      blog,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create blog' },
      { status: 500 }
    );
  }
} 