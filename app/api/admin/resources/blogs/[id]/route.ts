import { NextRequest, NextResponse } from 'next/server';
import { getBlogById, updateBlog, deleteBlog, checkSlugUnique, AdminBlogData } from '@/lib/services/admin/admin-blog-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const blog = await getBlogById(params.id);
    
    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      blog,
    });
  } catch (error: any) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const blogData: Partial<AdminBlogData> = await request.json();

    // Validate slug uniqueness if slug is being updated
    if (blogData.slug) {
      const isUnique = await checkSlugUnique(blogData.slug, params.id);
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

    const blog = await updateBlog(params.id, blogData);
    
    return NextResponse.json({
      success: true,
      blog,
    });
  } catch (error: any) {
    console.error('Error updating blog:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update blog' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    // Check if blog exists first
    const blog = await getBlogById(params.id);
    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    await deleteBlog(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete blog' },
      { status: 500 }
    );
  }
} 