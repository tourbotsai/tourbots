import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateBlogs, AdminBlogData } from '@/lib/services/admin/admin-blog-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function PUT(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { blogIds, updates }: { blogIds: string[], updates: Partial<AdminBlogData> } = await request.json();

    if (!blogIds || !Array.isArray(blogIds) || blogIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Blog IDs array is required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // Validate updates - only allow safe bulk operations
    const allowedFields = ['is_published', 'tags'];
    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));

    if (invalidFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid fields for bulk update: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    await bulkUpdateBlogs(blogIds, updates);
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${blogIds.length} blog(s)`,
      updatedCount: blogIds.length,
    });
  } catch (error: any) {
    console.error('Error bulk updating blogs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to bulk update blogs' },
      { status: 500 }
    );
  }
} 